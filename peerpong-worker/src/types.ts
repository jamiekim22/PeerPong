export interface Env {
    GAME_ROOMS: DurableObjectNamespace;
}

export interface Player {
    id: string;
    name: string;
    joinedAt: number;
    lastSeen: number;
}

export interface SignalMessage {
    type: 'offer' | 'answer' | 'ice-candidate';
    data: any;
    from: string;
    to: string;
    timestamp: number;
}

export interface RoomState {
    players: Player[];
    signals: SignalMessage[];
    createdAt: number;
    lastActivity: number;
}
