/**
 * Test script to verify complete workflow execution
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testCompleteWorkflow() {
  console.log('Testing Complete Workflow Execution...\n');

  try {
    // Trigger workflow
    console.log('Triggering workflow...');
    const triggerResponse = await axios.post(`${BASE_URL}/api/coaching/trigger`);
    const workflowId = triggerResponse.data.workflowId;
    console.log(`✓ Workflow ID: ${workflowId}\n`);

    // Poll for completion
    console.log('Polling for completion...');
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const statusResponse = await axios.get(
        `${BASE_URL}/api/coaching/status/${workflowId}`
      );
      
      console.log(`Attempt ${attempts + 1}: Status = ${statusResponse.data.status}`);
      
      if (statusResponse.data.status === 'completed') {
        completed = true;
        console.log('\n✓ Workflow completed successfully!\n');
        
        const result = statusResponse.data.result;
        console.log('Result Summary:');
        console.log(`  Risk Score: ${result.riskScore}`);
        console.log(`  Timestamp: ${result.timestamp}`);
        console.log(`  Coaching Length: ${result.coaching.length} characters`);
        console.log(`  Coaching Preview: ${result.coaching.substring(0, 150)}...`);
        console.log('\n  Pattern Indicators:');
        console.log(`    Over-Leverage: ${result.patterns.overLeverage.detected ? 'YES' : 'NO'} (${result.patterns.overLeverage.severity})`);
        console.log(`    Tilt/Revenge: ${result.patterns.tiltRevenge.detected ? 'YES' : 'NO'} (${result.patterns.tiltRevenge.instances} instances)`);
        console.log(`    Volatility Mismatch: ${result.patterns.volatilityMismatch.detected ? 'YES' : 'NO'}`);
        console.log(`    Trade Frequency: ${result.patterns.tradeFrequency.status}`);
        
      } else if (statusResponse.data.status === 'failed') {
        console.log('\n✗ Workflow failed');
        console.log(`  Error: ${statusResponse.data.error}`);
        console.log(`  Failed Step: ${statusResponse.data.failedStep}`);
        process.exit(1);
      }
      
      attempts++;
    }

    if (!completed) {
      console.log('\n⚠ Workflow did not complete within timeout');
      process.exit(1);
    }

    console.log('\n✓ Complete workflow test passed!');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('✗ API Error:', error.response?.status, error.response?.data);
    } else {
      console.error('✗ Error:', error);
    }
    process.exit(1);
  }
}

testCompleteWorkflow();
