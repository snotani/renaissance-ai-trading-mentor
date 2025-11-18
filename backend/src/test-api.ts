/**
 * Test script for backend API endpoints
 * Tests all three required endpoints:
 * - GET /api/trades
 * - POST /api/coaching/trigger
 * - GET /api/coaching/status/:workflowId
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
    console.log(`✓ Sample trade:`, tradesResponse.data.trades[0]);
    console.log('');

    // Test 2: POST /api/coaching/trigger
    console.log('Test 2: POST /api/coaching/trigger');
    const triggerResponse = await axios.post(`${BASE_URL}/api/coaching/trigger`);
    console.log(`✓ Status: ${triggerResponse.status}`);
    console.log(`✓ Workflow ID: ${triggerResponse.data.workflowId}`);
    const workflowId = triggerResponse.data.workflowId;
    console.log('');

    // Test 3: GET /api/coaching/status/:workflowId (pending)
    console.log('Test 3: GET /api/coaching/status/:workflowId (pending)');
    const statusResponse1 = await axios.get(
      `${BASE_URL}/api/coaching/status/${workflowId}`
    );
    console.log(`✓ Status: ${statusResponse1.status}`);
    console.log(`✓ Workflow status: ${statusResponse1.data.status}`);
    console.log('');

    // Wait for workflow to complete
    console.log('Waiting for workflow to complete...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const statusResponse = await axios.get(
        `${BASE_URL}/api/coaching/status/${workflowId}`
      );
      
      if (statusResponse.data.status === 'completed') {
        completed = true;
        console.log('✓ Workflow completed successfully!');
        console.log(`✓ Risk score: ${statusResponse.data.result.riskScore}`);
        console.log(`✓ Coaching preview: ${statusResponse.data.result.coaching.substring(0, 100)}...`);
        console.log(`✓ Patterns detected:`, Object.keys(statusResponse.data.result.patterns));
      } else if (statusResponse.data.status === 'failed') {
        console.log('✗ Workflow failed');
        console.log(`✗ Error: ${statusResponse.data.error}`);
        console.log(`✗ Failed step: ${statusResponse.data.failedStep}`);
        break;
      }
      
      attempts++;
    }

    if (!completed && attempts >= maxAttempts) {
      console.log('⚠ Workflow did not complete within timeout');
    }

    console.log('\n✓ All API endpoint tests completed!');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('✗ API Error:', error.response?.status, error.response?.data);
    } else {
      console.error('✗ Error:', error);
    }
    process.exit(1);
  }
}

// Run tests
testAPI();
