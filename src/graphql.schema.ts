
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum From {
    SERVER = "SERVER",
    CLIENT = "CLIENT"
}

export enum Request {
    CHECK_HASH = "CHECK_HASH",
    ADMIN_HELP = "ADMIN_HELP",
    PROCESS_SET_PERMISSION = "PROCESS_SET_PERMISSION"
}

export enum Response {
    PROCESS_UNKNOWN = "PROCESS_UNKNOWN",
    PROCESS_ALLOW = "PROCESS_ALLOW",
    PROCESS_DENY = "PROCESS_DENY",
    ADMIN_HELP_START = "ADMIN_HELP_START",
    ADMIN_HELP_PROCESS = "ADMIN_HELP_PROCESS",
    ADMIN_HELP_END = "ADMIN_HELP_END",
    ERROR = "ERROR"
}

export enum Permissions {
    NEW = "NEW",
    ALLOW = "ALLOW",
    DENY = "DENY",
    UNKNOWN = "UNKNOWN"
}

export class ProcessCreateInput {
    hash?: Nullable<string>;
    originalFilename?: Nullable<string>;
    permission?: Nullable<Permissions>;
}

export class ProcessUpdateInput {
    id?: Nullable<string>;
    adminHelp?: Nullable<string>;
    permission?: Nullable<string>;
}

export class ProcessRemoveInput {
    id?: Nullable<string>;
    hash?: Nullable<string>;
}

export class Activity {
    id?: Nullable<string>;
    proces_id?: Nullable<number>;
    guid?: Nullable<string>;
    hostname?: Nullable<string>;
    filename?: Nullable<string>;
    hash?: Nullable<string>;
    address?: Nullable<string>;
    port?: Nullable<string>;
    from?: Nullable<From>;
    request?: Nullable<Request>;
    response?: Nullable<Response>;
    createdAt?: Nullable<string>;
    updatedAt?: Nullable<string>;
}

export abstract class IQuery {
    abstract activities(): Nullable<Nullable<Activity>[]> | Promise<Nullable<Nullable<Activity>[]>>;

    abstract processes(): Nullable<Nullable<Process>[]> | Promise<Nullable<Nullable<Process>[]>>;

    abstract process(id?: Nullable<number>): Nullable<Process> | Promise<Nullable<Process>>;
}

export abstract class ISubscription {
    abstract activityCreated(): Nullable<Activity> | Promise<Nullable<Activity>>;

    abstract processCreated(): Nullable<Process> | Promise<Nullable<Process>>;
}

export class Process {
    id?: Nullable<string>;
    hash?: Nullable<string>;
    originalFilename?: Nullable<string>;
    extension?: Nullable<string>;
    permission?: Nullable<Permissions>;
    adminHelp?: Nullable<string>;
    createdAt?: Nullable<string>;
    updatedAt?: Nullable<string>;
}

export abstract class IMutation {
    abstract processCreate(input?: Nullable<ProcessCreateInput>): Nullable<Process> | Promise<Nullable<Process>>;

    abstract processUpdate(input?: Nullable<ProcessUpdateInput>): Nullable<Process> | Promise<Nullable<Process>>;

    abstract processRemove(input?: Nullable<ProcessRemoveInput>): boolean | Promise<boolean>;
}

export type JSON = any;
type Nullable<T> = T | null;
