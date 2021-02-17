declare namespace NodeJS {
  export interface ProcessEnv {
    REDIS_URL: string;
    POSTGRES_URL: string;
    SERVER_PORT: string;
    CORS_ORGIN: string;
    SESSION_SECRET: string;
  }
}
