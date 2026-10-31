import { DatabaseState } from '../data/seedData.ts';

export interface SanityConnectionStatus {
  configured: boolean;
  projectId: string;
  organizationId: string;
  dataset: string;
  connected: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  documentId: string;
}

const SANITY_STATE_DOC_ID = 'le-boivement-platform-state';
const SANITY_API_VERSION = 'v2024-01-01';

class SanityCloudAdapter {
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private connected: boolean = false;

  public getConfig() {
    const projectId = (process.env.SANITY_PROJECT_ID || 'uco8wbwq').trim();
    const organizationId = (process.env.SANITY_ORG_ID || 'oh314dkvd').trim();
    const dataset = (process.env.SANITY_DATASET || 'production').trim();
    const token = (process.env.SANITY_API_TOKEN || '').trim();
    return {
      projectId,
      organizationId,
      dataset,
      token,
      configured: Boolean(projectId && dataset && token),
    };
  }

  public getStatus(): SanityConnectionStatus {
    const cfg = this.getConfig();
    return {
      configured: cfg.configured,
      projectId: cfg.projectId,
      organizationId: cfg.organizationId,
      dataset: cfg.dataset,
      connected: this.connected,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
      documentId: SANITY_STATE_DOC_ID,
    };
  }

  public async fetchRemoteState(): Promise<DatabaseState | null> {
    const cfg = this.getConfig();
    if (!cfg.configured) {
      this.lastError = 'Variables SANITY_PROJECT_ID ou SANITY_API_TOKEN non configurées.';
      return null;
    }

    try {
      const query = encodeURIComponent(`*[_id == "${SANITY_STATE_DOC_ID}"][0]`);
      const url = `https://${cfg.projectId}.api.sanity.io/${SANITY_API_VERSION}/data/query/${cfg.dataset}?query=${query}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        this.lastError = `Sanity Query HTTP ${res.status}: ${errText.slice(0, 180)}`;
        this.connected = false;
        return null;
      }

      const json = (await res.json()) as { result?: { stateJson?: string; updatedAt?: string } | null };
      this.connected = true;
      this.lastError = null;

      if (json.result && typeof json.result.stateJson === 'string') {
        const parsed = JSON.parse(json.result.stateJson) as DatabaseState;
        this.lastSyncedAt = json.result.updatedAt || new Date().toISOString();
        return parsed;
      }
      return null;
    } catch (err: any) {
      this.lastError = err?.message || 'Erreur réseau Sanity.';
      this.connected = false;
      return null;
    }
  }

  public async pushStateToSanity(state: DatabaseState): Promise<{ ok: boolean; syncedAt?: string; error?: string }> {
    const cfg = this.getConfig();
    if (!cfg.configured) {
      this.lastError = 'Identifiants Sanity absents (.env).';
      return { ok: false, error: this.lastError };
    }

    try {
      const nowIso = new Date().toISOString();
      const mutations = [
        {
          createOrReplace: {
            _id: SANITY_STATE_DOC_ID,
            _type: 'boivementPlatformState',
            projectId: cfg.projectId,
            organizationId: cfg.organizationId,
            brandName: state.settings.brandName,
            city: state.settings.city,
            updatedAt: nowIso,
            counts: {
              products: state.products.length,
              inventoryItems: state.inventory.length,
              orders: state.orders.length,
              reservations: state.reservations.length,
              reviews: (state.reviews || []).length,
              events: state.events.length,
            },
            stateJson: JSON.stringify(state),
          },
        },
      ];

      const url = `https://${cfg.projectId}.api.sanity.io/${SANITY_API_VERSION}/data/mutate/${cfg.dataset}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.token}`,
        },
        body: JSON.stringify({ mutations }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.lastError = `Sanity Mutate HTTP ${res.status}: ${errText.slice(0, 180)}`;
        this.connected = false;
        return { ok: false, error: this.lastError || undefined };
      }

      this.connected = true;
      this.lastSyncedAt = nowIso;
      this.lastError = null;
      return { ok: true, syncedAt: nowIso };
    } catch (err: any) {
      this.lastError = err?.message || 'Erreur lors de la synchronisation Sanity.';
      this.connected = false;
      return { ok: false, error: this.lastError || undefined };
    }
  }
}

export const sanityAdapter = new SanityCloudAdapter();
