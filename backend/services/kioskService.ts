import { getAdminSupabaseClient } from '../lib/supabase/server';
import { Kiosk, CreateKioskRequest, UpdateKioskRequest, KioskStatus } from '../types/kiosk';

// Development in-memory fallback store if Supabase credentials are not yet connected
const mockStore: Map<string, Kiosk> = new Map();

export class KioskService {
  private isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return Boolean(url && key && !url.includes('placeholder') && !url.includes('YOUR_SUPABASE'));
  }

  /**
   * Retrieves all non-deleted kiosks with optional filtering & pagination
   */
  async getKiosks(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: KioskStatus;
    isActive?: boolean;
  }): Promise<{ kiosks: Kiosk[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const offset = (page - 1) * limit;

    if (!this.isSupabaseConfigured()) {
      let list = Array.from(mockStore.values()).filter((k) => k.deleted_at === null);

      if (options?.search) {
        const q = options.search.toLowerCase();
        list = list.filter(
          (k) =>
            k.kiosk_code.toLowerCase().includes(q) ||
            k.kiosk_name.toLowerCase().includes(q) ||
            (k.description && k.description.toLowerCase().includes(q))
        );
      }
      if (options?.status) {
        list = list.filter((k) => k.status === options.status);
      }
      if (typeof options?.isActive === 'boolean') {
        list = list.filter((k) => k.is_active === options.isActive);
      }

      const total = list.length;
      const paginated = list.slice(offset, offset + limit);
      return { kiosks: paginated, total };
    }

    const supabase = getAdminSupabaseClient();
    let query = supabase
      .from('kiosks')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (options?.search) {
      query = query.or(
        `kiosk_code.ilike.%${options.search}%,kiosk_name.ilike.%${options.search}%,description.ilike.%${options.search}%`
      );
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (typeof options?.isActive === 'boolean') {
      query = query.eq('is_active', options.isActive);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch kiosks: ${error.message}`);
    }

    return {
      kiosks: (data as Kiosk[]) || [],
      total: count || 0,
    };
  }

  /**
   * Retrieves single kiosk by ID or kiosk_code
   */
  async getKioskById(idOrCode: string): Promise<Kiosk | null> {
    if (!this.isSupabaseConfigured()) {
      for (const kiosk of mockStore.values()) {
        if (
          (kiosk.id === idOrCode || kiosk.kiosk_code === idOrCode) &&
          kiosk.deleted_at === null
        ) {
          return kiosk;
        }
      }
      return null;
    }

    const supabase = getAdminSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

    const query = supabase
      .from('kiosks')
      .select('*')
      .is('deleted_at', null);

    if (isUuid) {
      query.eq('id', idOrCode);
    } else {
      query.eq('kiosk_code', idOrCode);
    }

    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw new Error(`Failed to fetch kiosk: ${error.message}`);
    }

    return data as Kiosk;
  }

  /**
   * Checks if kiosk_code already exists
   */
  async isCodeTaken(kioskCode: string, excludeId?: string): Promise<boolean> {
    const formattedCode = kioskCode.trim().toUpperCase();

    if (!this.isSupabaseConfigured()) {
      for (const kiosk of mockStore.values()) {
        if (
          kiosk.kiosk_code.toUpperCase() === formattedCode &&
          kiosk.id !== excludeId &&
          kiosk.deleted_at === null
        ) {
          return true;
        }
      }
      return false;
    }

    const supabase = getAdminSupabaseClient();
    let query = supabase
      .from('kiosks')
      .select('id')
      .eq('kiosk_code', formattedCode)
      .is('deleted_at', null);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Code check failed: ${error.message}`);
    return Boolean(data && data.length > 0);
  }

  /**
   * Creates a new kiosk with duplicate check
   */
  async createKiosk(payload: CreateKioskRequest): Promise<Kiosk> {
    const code = payload.kiosk_code.trim().toUpperCase();

    const exists = await this.isCodeTaken(code);
    if (exists) {
      const err = new Error(`Kiosk with code '${code}' already exists.`);
      (err as unknown as { code: string }).code = 'CONFLICT';
      throw err;
    }

    if (!this.isSupabaseConfigured()) {
      const newKiosk: Kiosk = {
        id: crypto.randomUUID(),
        kiosk_code: code,
        kiosk_name: payload.kiosk_name.trim(),
        description: payload.description || null,
        status: payload.status || 'offline',
        is_active: payload.is_active ?? true,
        configuration: payload.configuration || {
          screenTitle: 'Welcome',
          language: 'en',
          theme: 'dark',
        },
        last_seen: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      mockStore.set(newKiosk.id, newKiosk);
      return newKiosk;
    }

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kiosks')
      .insert({
        kiosk_code: code,
        kiosk_name: payload.kiosk_name.trim(),
        description: payload.description || null,
        status: payload.status || 'offline',
        is_active: payload.is_active ?? true,
        configuration: payload.configuration || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        const conflictErr = new Error(`Kiosk with code '${code}' already exists.`);
        (conflictErr as unknown as { code: string }).code = 'CONFLICT';
        throw conflictErr;
      }
      throw new Error(`Failed to create kiosk: ${error.message}`);
    }

    return data as Kiosk;
  }

  /**
   * Updates an existing kiosk
   */
  async updateKiosk(id: string, payload: UpdateKioskRequest): Promise<Kiosk> {
    const existing = await this.getKioskById(id);
    if (!existing) {
      const notFoundErr = new Error(`Kiosk with ID '${id}' not found.`);
      (notFoundErr as unknown as { code: string }).code = 'NOT_FOUND';
      throw notFoundErr;
    }

    if (!this.isSupabaseConfigured()) {
      const updated: Kiosk = {
        ...existing,
        kiosk_name: payload.kiosk_name !== undefined ? payload.kiosk_name.trim() : existing.kiosk_name,
        description: payload.description !== undefined ? payload.description : existing.description,
        status: payload.status !== undefined ? payload.status : existing.status,
        is_active: payload.is_active !== undefined ? payload.is_active : existing.is_active,
        configuration: payload.configuration !== undefined ? { ...existing.configuration, ...payload.configuration } : existing.configuration,
        updated_at: new Date().toISOString(),
      };
      mockStore.set(existing.id, updated);
      return updated;
    }

    const supabase = getAdminSupabaseClient();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.kiosk_name !== undefined) updateData.kiosk_name = payload.kiosk_name.trim();
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    if (payload.configuration !== undefined) updateData.configuration = payload.configuration;

    const { data, error } = await supabase
      .from('kiosks')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update kiosk: ${error.message}`);
    }

    return data as Kiosk;
  }

  /**
  /**
   * Deletes a kiosk from Supabase / store
   */
  async deleteKiosk(id: string): Promise<boolean> {
    const existing = await this.getKioskById(id);
    if (!existing) {
      const notFoundErr = new Error(`Kiosk with ID '${id}' not found.`);
      (notFoundErr as unknown as { code: string }).code = 'NOT_FOUND';
      throw notFoundErr;
    }

    if (!this.isSupabaseConfigured()) {
      mockStore.delete(existing.id);
      return true;
    }

    const supabase = getAdminSupabaseClient();
    
    // Attempt deletion from Supabase
    const { error: deleteError } = await supabase
      .from('kiosks')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      // If foreign key constraints exist, fallback to soft-delete
      const { error: softError } = await supabase
        .from('kiosks')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', existing.id);

      if (softError) {
        throw new Error(`Failed to delete kiosk: ${softError.message}`);
      }
    }

    return true;
  }

  async softDeleteKiosk(id: string): Promise<boolean> {
    return this.deleteKiosk(id);
  }

  /**
   * Records a heartbeat and updates last_seen
   */
  async recordHeartbeat(id: string, status: 'online' | 'maintenance' = 'online'): Promise<Kiosk> {
    const existing = await this.getKioskById(id);
    if (!existing) {
      const notFoundErr = new Error(`Kiosk with ID '${id}' not found.`);
      (notFoundErr as unknown as { code: string }).code = 'NOT_FOUND';
      throw notFoundErr;
    }

    const nowIso = new Date().toISOString();

    if (!this.isSupabaseConfigured()) {
      existing.last_seen = nowIso;
      existing.status = status;
      existing.updated_at = nowIso;
      mockStore.set(existing.id, existing);
      return existing;
    }

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('kiosks')
      .update({
        last_seen: nowIso,
        status: status,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record heartbeat: ${error.message}`);
    }

    return data as Kiosk;
  }
}

export const kioskService = new KioskService();
