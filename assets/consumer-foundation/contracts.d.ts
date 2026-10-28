/** Source station order is NOT a passenger service, ticket, timetable or track. */
export type DataStatus = 'UNKNOWN' | 'UNAVAILABLE' | 'SOURCE_CONFLICT';
export interface StationRef { readonly stationId: string; readonly name: string; readonly operationalStatus: string }
export interface Journey { readonly schemaVersion: '1.0.0'; readonly mode: 'SIMULATION'; readonly originId: string; readonly destinationId: string; readonly lineup: readonly StationRef[]; readonly currentIndex: number; readonly location: LocationState; readonly timetable: TimetableState; readonly eta: ETAState; readonly network: 'ONLINE'|'OFFLINE'|'UNKNOWN' }
export interface LocationState { readonly permission: 'NOT_REQUESTED'|'GRANTED'|'DENIED'|'UNAVAILABLE'; readonly position: null|{longitude:number;latitude:number;accuracyMetres:number;observedAt:string}; readonly mapMatch: 'UNKNOWN'|'UNRESOLVED'; readonly reason:string }
export interface TimetableState { readonly status:'UNAVAILABLE'; readonly sourceUrl:null; readonly observedAt:null }
export interface ETAState { readonly status:'UNKNOWN'; readonly arrivalAt:null; readonly reason:string }
export interface JourneyProgress { readonly currentStation: StationRef; readonly nextStation: StationRef|null; readonly completedLegs:number; readonly totalLegs:number; readonly percentage:number; readonly arrived:boolean }
/** Future permission requests require an explicit user gesture, never engine startup. */
export interface LocationProvider { requestPermissionFromUserGesture():Promise<LocationState>; stop():void }
/** A future matching provider requires source-verified physical track evidence. */
export interface VerifiedTrackProvider { readonly evidenceVersion:string; match(position:NonNullable<LocationState['position']>):Promise<{status:'UNKNOWN'|'UNRESOLVED';segmentId:null}> }
