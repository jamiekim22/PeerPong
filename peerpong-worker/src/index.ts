import { DurableObject } from "cloudflare:workers";
import { GameRoom } from "./gameroom";
import { Env } from "./types";

export { GameRoom };
/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type"
		};

		if (request.method === "OPTIONS") {
			// Handle preflight requests
			return new Response(null, {
				status: 204,
				headers: corsHeaders
			});
		}
		try {
			if (path === '/host' && request.method === "POST") {
				const gameCode = generateGameCode();
				const roomId = env.GAME_ROOMS.idFromName(gameCode);
				const room = env.GAME_ROOMS.get(roomId);

				await room.fetch(new Request('http://localhost/init', {method: 'POST'}));
				
				return new Response(JSON.stringify({ gameCode }), {
					headers: {...corsHeaders, "Content-Type": "application/json"}
				});
			}

			if (path.startsWith('/game/') && request.method === "POST") {
				const gameCode = path.split('/')[2];
				const action = path.split('/')[3]; // Note to self: gonna be 'join' or 'signal' depending on who is calling
				
				if (!gameCode || !action) {
					return new Response(JSON.stringify({ error: 'Invalid path' }), {
						status: 400,
						headers: {...corsHeaders, "Content-Type": "application/json"}
					});
				}
				
				const roomId = env.GAME_ROOMS.idFromName(gameCode);
				const room = env.GAME_ROOMS.get(roomId);

				// Clone the request body for forwarding
				const requestBody = request.body ? await request.text() : null;
				
				// Forward the request to the game room with the correct path
				const roomRequest = new Request(`http://localhost/${action}`, {
					method: request.method,
					headers: {
						'Content-Type': 'application/json'
					},
					body: requestBody
				});

				return await room.fetch(roomRequest);
			}

			if (path.startsWith('/game/') && request.method === "GET") {
				const gameCode = path.split('/')[2];
				const action = path.split('/')[3]; // Note to self: gonna be 'status' or 'signals'
				const playerId = path.split('/')[4]; 
				
				if (!gameCode || !action) {
					return new Response(JSON.stringify({ error: 'Invalid path' }), {
						status: 400,
						headers: {...corsHeaders, "Content-Type": "application/json"}
					});
				}
				
				const roomId = env.GAME_ROOMS.idFromName(gameCode);
				const room = env.GAME_ROOMS.get(roomId);

				// Forward the request to the game room with the correct path
				let roomPath = `/${action}`;
				if (action === 'signals' && playerId) {
					roomPath = `/signals/${playerId}`;
				}

				const roomRequest = new Request(`http://localhost${roomPath}`, {
					method: request.method,
					headers: {
						'Content-Type': 'application/json'
					}
				});

				return await room.fetch(roomRequest);
			}

			return new Response('Endpoint not found', {
				status: 404,
				headers: corsHeaders
			});

		} catch (e : any) {
			return new Response(JSON.stringify({ error: e.message }), {
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}
	}

} satisfies ExportedHandler<Env>;

function generateGameCode(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < 4; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}
