#!/usr/bin/env node
/**
 * Manual Test Script for PeerPong Worker
 * 
 * This script tests all the worker endpoints by making HTTP requests.
 * 
 * Prerequisites:
 * 1. Make sure your worker is running: npm run dev
 * 2. Install node-fetch if not available: npm install node-fetch
 * 3. Run this script: node test/manual-test.js
 */

// const BASE_URL = 'http://localhost:8787';
const BASE_URL = 'https://peerpong-worker.erik-gaming-official.workers.dev'

// Helper function to make HTTP requests
async function makeRequest(method, path, body = null) {
    const url = `${BASE_URL}${path}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type');
        
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        return {
            status: response.status,
            data,
            success: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            status: 0,
            data: { error: error.message },
            success: false,
            headers: {}
        };
    }
}

// Test result logger
function logTest(testName, result) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Data:`, result.data);
    
    // Log CORS headers for verification
    if (result.headers['access-control-allow-origin']) {
        console.log(`   CORS: ${result.headers['access-control-allow-origin']}`);
    }
    console.log('');
}

// Main test suite
async function runTests() {
    console.log('🚀 Starting PeerPong Worker Manual Tests...\n');
    console.log('Make sure your worker is running with: npm run dev\n');
    
    try {
        // Test 1: CORS Preflight
        console.log('=== Test 1: CORS Preflight ===');
        const corsResult = await makeRequest('OPTIONS', '/host');
        logTest('OPTIONS /host (CORS)', corsResult);
        
        // Test 2: Create Game Room
        console.log('=== Test 2: Create Game Room ===');
        const hostResult = await makeRequest('POST', '/host');
        logTest('POST /host', hostResult);
        
        if (!hostResult.success) {
            console.log('❌ Cannot continue tests - host creation failed');
            return;
        }
        
        const gameCode = hostResult.data.gameCode;
        console.log(`📝 Using Game Code: ${gameCode}\n`);
        
        // Test 3: Join Game Room (Player 1)
        console.log('=== Test 3: Player 1 Join ===');
        const player1JoinResult = await makeRequest('POST', `/game/${gameCode}/join`, {
            playerId: 'player1',
            playerName: 'mmacroni'
        });
        logTest('POST /game/{code}/join (Player 1)', player1JoinResult);
        
        // Test 4: Join Game Room (Player 2)
        console.log('=== Test 4: Player 2 Join ===');
        const player2JoinResult = await makeRequest('POST', `/game/${gameCode}/join`, {
            playerId: 'player2',
            playerName: 'rooks.plates'
        });
        logTest('POST /game/{code}/join (Player 2)', player2JoinResult);
        
        // Test 5: Get Room Status
        console.log('=== Test 5: Room Status ===');
        const statusResult = await makeRequest('GET', `/game/${gameCode}/status`);
        logTest('GET /game/{code}/status', statusResult);
        
        // Test 6: Send WebRTC Signal
        console.log('=== Test 6: Send WebRTC Signal ===');
        const signalResult = await makeRequest('POST', `/game/${gameCode}/signal`, {
            type: 'offer',
            data: { 
                sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
                type: 'offer' 
            },
            from: 'player1',
            to: 'player2'
        });
        logTest('POST /game/{code}/signal', signalResult);
        
        // Test 7: Get Signals for Player 2
        console.log('=== Test 7: Get Signals for Player 2 ===');
        const signalsResult = await makeRequest('GET', `/game/${gameCode}/signals/player2`);
        logTest('GET /game/{code}/signals/{playerId}', signalsResult);
        
        // Test 8: Send ICE Candidate
        console.log('=== Test 8: Send ICE Candidate ===');
        const iceResult = await makeRequest('POST', `/game/${gameCode}/signal`, {
            type: 'ice-candidate',
            data: {
                candidate: 'candidate:1 1 UDP 2013266431 192.168.1.100 54400 typ host',
                sdpMLineIndex: 0,
                sdpMid: '0'
            },
            from: 'player2',
            to: 'player1'
        });
        logTest('POST /game/{code}/signal (ICE)', iceResult);
        
        // Test 9: Try to Join Full Room (Should Fail)
        console.log('=== Test 9: Join Full Room (Should Fail) ===');
        const player3JoinResult = await makeRequest('POST', `/game/${gameCode}/join`, {
            playerId: 'player3',
            playerName: 'TheIceCreamBoss'
        });
        logTest('POST /game/{code}/join (Player 3 - Should Fail)', player3JoinResult);
        
        // Test 10: Invalid Game Code
        console.log('=== Test 10: Invalid Game Code ===');
        const invalidCodeResult = await makeRequest('GET', `/game/INVALID/status`);
        logTest('GET /game/INVALID/status', invalidCodeResult);
        
        // Test 11: Invalid Endpoint
        console.log('=== Test 11: Invalid Endpoint ===');
        const invalidEndpointResult = await makeRequest('GET', '/invalid-endpoint');
        logTest('GET /invalid-endpoint', invalidEndpointResult);
        
        // Test 12: Invalid Join Data
        console.log('=== Test 12: Invalid Join Data ===');
        const invalidJoinResult = await makeRequest('POST', `/game/${gameCode}/join`, {
            playerId: '', // Empty playerId
            playerName: 'Test'
        });
        logTest('POST /game/{code}/join (Invalid Data)', invalidJoinResult);
        
        // Test 13: Invalid Signal Data
        console.log('=== Test 13: Invalid Signal Data ===');
        const invalidSignalResult = await makeRequest('POST', `/game/${gameCode}/signal`, {
            type: 'offer',
            data: { sdp: 'test' }
            // Missing from and to fields
        });
        logTest('POST /game/{code}/signal (Invalid Data)', invalidSignalResult);
        
        console.log('🎉 All tests completed!');
        console.log('\n📊 Summary:');
        console.log('- Test the worker locally with: npm run dev');
        console.log('- Deploy to Cloudflare with: npm run deploy');
        console.log('- View logs with: wrangler tail');
        
    } catch (error) {
        console.error('💥 Test suite failed:', error);
    }
}

// Run the tests
if (typeof fetch === 'undefined') {
    console.error('❌ fetch is not available. Please run this script in Node.js 18+ or install node-fetch');
    process.exit(1);
}

runTests();
