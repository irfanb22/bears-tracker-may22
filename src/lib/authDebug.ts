import { User } from '@supabase/supabase-js';

interface AuthLog {
  timestamp: number;
  event: string;
  details?: unknown;
  error?: unknown;
}

class AuthDebugger {
  private static instance: AuthDebugger;
  private logs: AuthLog[] = [];
  private readonly STORAGE_KEY = 'auth_debug_logs';
  private readonly MAX_LOGS = 1000;

  private constructor() {
    this.loadLogs();
  }

  public static getInstance(): AuthDebugger {
    if (!AuthDebugger.instance) {
      AuthDebugger.instance = new AuthDebugger();
    }
    return AuthDebugger.instance;
  }

  private loadLogs(): void {
    try {
      const storedLogs = localStorage.getItem(this.STORAGE_KEY);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
        console.log('[AUTH_DEBUG] Loaded stored logs:', this.logs.length);
      }
    } catch (error) {
      console.error('[AUTH_DEBUG] Error loading stored logs:', error);
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('[AUTH_DEBUG] Error saving logs:', error);
    }
  }

  private sanitizePayload(payload: unknown): unknown {
    if (Array.isArray(payload)) {
      return payload.map((item) => this.sanitizePayload(item));
    }

    if (payload && typeof payload === 'object') {
      const redacted = ['access_token', 'refresh_token', 'provider_token', 'provider_refresh_token'];
      const record = payload as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};

      Object.entries(record).forEach(([key, value]) => {
        if (redacted.includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizePayload(value);
        }
      });

      return sanitized;
    }

    return payload;
  }

  public log(event: string, details?: unknown): void {
    const log: AuthLog = {
      timestamp: Date.now(),
      event,
      details: this.sanitizePayload(details)
    };

    console.log(`[AUTH_DEBUG] ${event}`, log.details || '');
    
    this.logs.unshift(log);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }
    
    this.saveLogs();
  }

  public logError(event: string, error: unknown): void {
    const log: AuthLog = {
      timestamp: Date.now(),
      event,
      error: this.sanitizePayload(this.sanitizeError(error))
    };

    console.error(`[AUTH_DEBUG] Error - ${event}:`, error);
    
    this.logs.unshift(log);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }
    
    this.saveLogs();
  }

  private sanitizeError(error: unknown): unknown {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    return error;
  }

  public getLogs(): AuthLog[] {
    return this.logs;
  }

  public clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[AUTH_DEBUG] Logs cleared');
  }

  public logAuthState(user: User | null): void {
    this.log('Auth State Change', {
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
      lastSignInAt: user?.last_sign_in_at
    });
  }

  public formatLogs(): string {
    return this.logs.map(log => {
      const date = new Date(log.timestamp).toISOString();
      const details = log.details ? JSON.stringify(log.details, null, 2) : '';
      const error = log.error ? JSON.stringify(log.error, null, 2) : '';
      return `[${date}] ${log.event}\n${details}${error}\n`;
    }).join('\n');
  }
}

export const authDebugger = AuthDebugger.getInstance();
