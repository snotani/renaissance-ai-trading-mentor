/**
 * Simple test script for backend API endpoints
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('Testing Backend API Endpoints...\n');

  try {
    // Test 1: GET /api/trades
    console.log('Test 1: GET /api/trades');
    const tradesResponse = await axios.get(`${BASE_URL}/api/trades`);
    console.log(`✓ Status: ${tradesResponse.status}`);
    console.log(`✓ Received ${tradesResponse.data.trades.length} trades`);
    console.log('');

    // Test 2: POST /api/coaching/trigger
    console.log('Test 2: POST /api/coaching/trigger');
    const triggerResponse = await axios.post(`${BASE_URL}/api/coaching/trigger`);
    console.log(`✓ Status: ${triggerResponse.status}`);
    console.log(`✓ Workflow ID: ${triggerResponse.data.workflowId}`);
    const workflowId = triggerResponse.data.workflowId;
    console.log('');

    // Test 3: GET /api/coaching/status/:workflowId (immediate check)
    console.log('Test 3: GET /api/coaching/status/:workflowId');
    const statusResponse = await axios.get(
      `${BASE_URL}/api/coaching/status/${workflowId}`
    );
    console.log(`✓ Status: ${statusResponse.status}`);
    console.log(`✓ Workflow status: ${statusResponse.data.status}`);
    console.log('');

    // Test 4: GET /api/coaching/status/:workflowId (non-existent)
    console.log('Test 4: GET /api/coaching/status/:workflowId (non-existent)');
    try {
      await axios.get(`${BASE_URL}/api/coaching/status/invalid-id`);
      console.log('✗ Should have returned 404');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`✓ Correctly returned 404 for non-existent workflow`);
      } else {
        throw error;
      }
    }

    console.log('\n✓ All API endpoint tests passed!');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('✗ API Error:', error.response?.status, error.response?.data);
    } else {
      console.error('✗ Error:', error);
    }
    process.exit(1);
  }
}

testAPI();
