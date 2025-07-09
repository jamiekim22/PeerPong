import { DurableObject } from "cloudflare:workers";
import { Env, Player, SignalMessage, RoomState } from "./types";

export class GameRoom extends DurableObject<Env> {
    private state: RoomState;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.state = {
            players: [],
            signals: [],
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
        
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }
        
        try {
            if (path === '/init' && request.method === 'POST') {
                return this.handleInit(corsHeaders);
            }

            if (path === '/join' && request.method === 'POST') {
                return this.handleJoin(request, corsHeaders);
            }

            if (path === '/signal' && request.method === 'POST') {
                return this.handleSignal(request, corsHeaders);
            }

            if (path.startsWith('/signals/') && request.method === 'GET') {
                const playerId = path.split('/')[2];
                return this.handleGetSignals(playerId, corsHeaders);
            }

            if (path === '/status' && request.method === 'GET') {
                return this.handleStatus(corsHeaders);
            }

            return new Response('Not found', { 
                status: 404, 
                headers: corsHeaders 
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return new Response(JSON.stringify({ error: errorMessage }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    private async loadState(): Promise<void> {
        const stored = await this.ctx.storage.get('roomState');
        if (stored) {
            this.state = stored as RoomState;
        }
    }

    private async saveState(): Promise<void> {
        await this.ctx.storage.put('roomState', this.state);
    }

    private async handleInit(corsHeaders: Record<string, string>): Promise<Response> {
        await this.loadState();
        
        // Initialize or reset the room
        this.state = {
            players: [],
            signals: [],
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        await this.saveState();
        
        return new Response(JSON.stringify({ status: 'room initialized' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    private async handleJoin(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
        await this.loadState();
        
        const body = await request.json() as { playerId: string; playerName: string };
        
        // Validate input
        if (!body.playerId || !body.playerName) {
            return new Response(JSON.stringify({ error: 'playerId and playerName are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // Check if room is full (max 2 players for pong)
        if (this.state.players.length >= 2) {
            const existingPlayer = this.state.players.find(p => p.id === body.playerId);
            if (!existingPlayer) {
                return new Response(JSON.stringify({ error: 'Room is full' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Check if player already exists
        const existingPlayer = this.state.players.find(p => p.id === body.playerId);
        if (existingPlayer) {
            existingPlayer.lastSeen = Date.now();
        } else {
            // Add new player
            const newPlayer: Player = {
                id: body.playerId,
                name: body.playerName,
                joinedAt: Date.now(),
                lastSeen: Date.now()
            };
            this.state.players.push(newPlayer);
        }
        
        this.state.lastActivity = Date.now();
        await this.saveState();
        
        return new Response(JSON.stringify({ 
            status: 'joined',
            playerId: body.playerId,
            playerCount: this.state.players.length,
            isHost: this.state.players.length === 1
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    private async handleSignal(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
        await this.loadState();
        
        const body = await request.json() as {
            type: 'offer' | 'answer' | 'ice-candidate';
            data: any;
            from: string;
            to: string;
        };
        
        // Validate input
        if (!body.type || !body.from || !body.to) {
            return new Response(JSON.stringify({ error: 'type, from, and to are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // Validate that both players exist in the room
        const fromPlayer = this.state.players.find(p => p.id === body.from);
        const toPlayer = this.state.players.find(p => p.id === body.to);
        
        if (!fromPlayer || !toPlayer) {
            return new Response(JSON.stringify({ error: 'Player not found in room' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // Add the signal to the room's signal queue
        const signal: SignalMessage = {
            type: body.type,
            data: body.data,
            from: body.from,
            to: body.to,
            timestamp: Date.now()
        };
        
        this.state.signals.push(signal);
        this.state.lastActivity = Date.now();
        
        // Clean up old signals (keep only last 100)
        if (this.state.signals.length > 100) {
            this.state.signals = this.state.signals.slice(-100);
        }
        
        await this.saveState();
        
        return new Response(JSON.stringify({ status: 'signal sent' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    private async handleGetSignals(playerId: string, corsHeaders: Record<string, string>): Promise<Response> {
        await this.loadState();
        
        // Get signals for this player
        const playerSignals = this.state.signals.filter(signal => signal.to === playerId);
        
        // Remove the signals that were retrieved
        this.state.signals = this.state.signals.filter(signal => signal.to !== playerId);
        
        await this.saveState();
        
        return new Response(JSON.stringify({ signals: playerSignals }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    private async handleStatus(corsHeaders: Record<string, string>): Promise<Response> {
        await this.loadState();
        
        return new Response(JSON.stringify({
            playerCount: this.state.players.length,
            players: this.state.players.map(p => ({ id: p.id, name: p.name })),
            createdAt: this.state.createdAt,
            lastActivity: this.state.lastActivity
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}