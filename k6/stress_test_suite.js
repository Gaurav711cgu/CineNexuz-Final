import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 50 },   // Ramp up to 50 virtual users
    { duration: '10s', target: 100 }, // Spike to 100 VUs (2,500 QPS target)
    { duration: '5s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<50', 'p(99)<100'], // 95% of requests < 50ms, 99% < 100ms
    http_req_failed: ['rate<0.01'],               // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  // 1. Trending Movies Catalog Test
  const resTrending = http.get(`${BASE_URL}/api/v1/movies/trending?limit=10`);
  check(resTrending, {
    'trending status is 200': (r) => r.status === 200,
    'trending response duration < 30ms': (r) => r.timings.duration < 30,
  });

  // 2. Singleflight Cache Stampede Thundering Herd Test
  const resRecs = http.get(`${BASE_URL}/api/v1/recommendations?user_id=usr_k6_test&limit=5`);
  check(resRecs, {
    'recommendations status is 200': (r) => r.status === 200,
    'recommendations payload has items': (r) => JSON.parse(r.body).recommendations.length === 5,
  });

  // 3. Health Probe Test
  const resHealth = http.get(`${BASE_URL}/api/v1/analytics/health/deep`);
  check(resHealth, {
    'health probe status is 200': (r) => r.status === 200,
  });

  sleep(0.1);
}
