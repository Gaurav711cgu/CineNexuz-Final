import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up
    { duration: '4m', target: 100 },   // Sustained 100 RPS load
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<100'],  // 99% of requests must complete under 100ms SLA
    http_req_failed: ['rate<0.01'],    // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  let userId = `user_${Math.floor(Math.random() * 1000)}`;

  // Test Recommendation Endpoint
  let recRes = http.get(`${BASE_URL}/api/v1/recommendations?user_id=${userId}`);
  check(recRes, {
    'recommendation status is 200': (r) => r.status === 200,
    'recommendation p99 < 100ms': (r) => r.timings.duration < 100,
  });

  // Test Search Endpoint
  let searchRes = http.get(`${BASE_URL}/api/v1/search?q=action`);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search latency < 50ms': (r) => r.timings.duration < 50,
  });

  sleep(0.1);
}
