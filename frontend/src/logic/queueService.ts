import { QueueInfo } from '../types/tablemate';

const queueByPlaceId: Record<string, QueueInfo> = {
  r1: { placeId: 'r1', exists: true, waitingCount: 2 },
  r2: { placeId: 'r2', exists: false, waitingCount: 0 },
  r3: { placeId: 'r3', exists: true, waitingCount: 1 },
  c1: { placeId: 'c1', exists: true, waitingCount: 3 },
  c2: { placeId: 'c2', exists: false, waitingCount: 0 },
  c3: { placeId: 'c3', exists: true, waitingCount: 1 },
  b1: { placeId: 'b1', exists: false, waitingCount: 0 },
  b2: { placeId: 'b2', exists: true, waitingCount: 2 },
  b3: { placeId: 'b3', exists: false, waitingCount: 0 },
};

export function getQueueInfo(placeId: string): QueueInfo {
  return (
    queueByPlaceId[placeId] ?? {
      placeId,
      exists: false,
      waitingCount: 0,
    }
  );
}
