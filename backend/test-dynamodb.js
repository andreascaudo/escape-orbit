const AWS = require('aws-sdk');

// Set the AWS region - make sure this matches your serverless.yml
AWS.config.update({ region: 'eu-central-1' });

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'EscapeOrbitLeaderboard';

// Test putting an item
async function testPut() {
    console.log('Testing PUT operation to DynamoDB...');

    const testItem = {
        id: 'test-item-' + Date.now(),
        username: 'test-user',
        score: 100,
        planetsVisited: 5,
        date: new Date().toISOString()
    };

    const params = {
        TableName: TABLE_NAME,
        Item: testItem
    };

    try {
        console.log('Putting test item:', testItem);
        await dynamoDB.put(params).promise();
        console.log('PUT operation successful!');
        return testItem.id;
    } catch (error) {
        console.error('PUT operation failed:', error);
        throw error;
    }
}

// Test getting all items
async function testScan() {
    console.log('Testing SCAN operation to DynamoDB...');

    const params = {
        TableName: TABLE_NAME
    };

    try {
        const result = await dynamoDB.scan(params).promise();
        console.log('SCAN operation successful!');
        console.log('Items in table:', result.Items ? result.Items.length : 0);
        console.log('Items:', JSON.stringify(result.Items, null, 2));
        return result.Items;
    } catch (error) {
        console.error('SCAN operation failed:', error);
        throw error;
    }
}

// Test getting a specific item
async function testGet(id) {
    console.log(`Testing GET operation for item ${id}...`);

    const params = {
        TableName: TABLE_NAME,
        Key: { id }
    };

    try {
        const result = await dynamoDB.get(params).promise();
        console.log('GET operation successful!');
        console.log('Item:', result.Item ? JSON.stringify(result.Item, null, 2) : 'Not found');
        return result.Item;
    } catch (error) {
        console.error('GET operation failed:', error);
        throw error;
    }
}

// Run all tests
async function runTests() {
    try {
        console.log('\n=== DYNAMODB CONNECTION TEST ===\n');
        console.log('Table name:', TABLE_NAME);
        console.log('AWS Region:', AWS.config.region);

        // Test putting an item
        const itemId = await testPut();

        // Test scanning all items
        await testScan();

        // Test getting the specific item we just put
        if (itemId) {
            await testGet(itemId);
        }

        console.log('\n=== TEST COMPLETE ===\n');
    } catch (error) {
        console.error('\n=== TEST FAILED ===\n', error);
    }
}

runTests(); 