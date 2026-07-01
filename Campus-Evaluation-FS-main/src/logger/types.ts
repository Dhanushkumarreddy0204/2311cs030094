export type Stack =
  | "backend"
  | "frontend";

export type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal";

export type BackendPackage =
  | "cache"
  | "controller"
  | "cron_job"
  | "db"
  | "domain"
  | "handler"
  | "redis"
  | "repository"
  | "route"
  | "service";

export type FrontendPackage =
  | "api"
  | "component"
  | "hook"
  | "page"
  | "state"
  | "style";

export type SharedPackage =
  | "auth"
  | "config"
  | "middleware"
  | "utils";

export type PackageName =
  | BackendPackage
  | FrontendPackage
  | SharedPackage;
