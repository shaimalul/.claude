# Cloud Service Mocking

Supporting reference for [SKILL.md](SKILL.md).

## Cloud Service Mocking

### AWS Services with @aws-sdk/client-mock

```typescript
import { mockClient } from '@aws-sdk/client-mock';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Readable } from 'stream';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';

const s3Mock = mockClient(S3Client);
const dynamoMock = mockClient(DynamoDBClient);
const sqsMock = mockClient(SQSClient);

beforeEach(() => {
  s3Mock.reset();
  dynamoMock.reset();
  sqsMock.reset();
});

// S3 examples
s3Mock.on(GetObjectCommand).resolves({
  Body: sdkStreamMixin(Readable.from([Buffer.from('test content')])),
});

s3Mock.on(PutObjectCommand).resolves({
  ETag: '"abc123"',
});

// DynamoDB examples
dynamoMock.on(GetItemCommand).resolves({
  Item: { id: { S: '123' }, name: { S: 'Test' } },
});

// SQS examples
sqsMock.on(SendMessageCommand).resolves({
  MessageId: 'msg-123',
});
```

### GCP Services

Use official emulators or mock libraries:

```typescript
// Firestore: use @google-cloud/firestore with emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Cloud Storage: use mock-cloud-storage
import { MockStorage } from 'mock-cloud-storage';
const storage = new MockStorage();

// Pub/Sub: use @google-cloud/pubsub with emulator
process.env.PUBSUB_EMULATOR_HOST = 'localhost:8085';
```

### Azure Services

Use official emulators where available:

```typescript
// Blob Storage: use Azurite emulator
process.env.AZURE_STORAGE_CONNECTION_STRING = 
  'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;...';

// Cosmos DB: use emulator
process.env.COSMOS_ENDPOINT = 'https://localhost:8081';
```
