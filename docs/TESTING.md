# Testing & Quality Assurance Strategy

## 🧪 Testing Overview

This document outlines the comprehensive testing strategy for the Referral & Code Redemption System, ensuring code quality, reliability, and maintainability.

## 🎯 Testing Goals

- **Code Quality**: Maintain high code standards and prevent regressions
- **Reliability**: Ensure system stability and error-free operation
- **Security**: Validate security measures and prevent vulnerabilities
- **Performance**: Monitor and optimize system performance
- **User Experience**: Verify smooth user workflows and interactions

## 🏗️ Testing Architecture

### Testing Pyramid
```
    E2E Tests (Few, Slow)
        /     \
   Integration Tests (Some, Medium)
        /     \
   Unit Tests (Many, Fast)
```

### Test Categories
1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and database interactions
3. **E2E Tests**: Complete user journeys
4. **Performance Tests**: Load testing and optimization
5. **Security Tests**: Vulnerability assessment and penetration testing

## 🧩 Unit Testing

### Framework: Jest + React Testing Library

#### Test Structure
```typescript
// Example: lib/utils.test.ts
import { generateRandomCode, hashCode, formatPoints } from '../utils';

describe('Utility Functions', () => {
  describe('generateRandomCode', () => {
    it('should generate code of specified length', () => {
      const code = generateRandomCode(8);
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRandomCode(8));
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('hashCode', () => {
    it('should generate consistent hashes for same input', async () => {
      const code = 'TEST123';
      const salt = 'salt123';
      const hash1 = await hashCode(code, salt);
      const hash2 = await hashCode(code, salt);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', async () => {
      const code1 = 'TEST123';
      const code2 = 'TEST124';
      const salt = 'salt123';
      const hash1 = await hashCode(code1, salt);
      const hash2 = await hashCode(code2, salt);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('formatPoints', () => {
    it('should format points with commas', () => {
      expect(formatPoints(1000)).toBe('1,000');
      expect(formatPoints(1234567)).toBe('1,234,567');
    });

    it('should handle zero and negative values', () => {
      expect(formatPoints(0)).toBe('0');
      expect(formatPoints(-100)).toBe('-100');
    });
  });
});
```

#### Component Testing
```typescript
// Example: components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');

    rerender(<Button variant="secondary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary-600');
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should show loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});
```

### Test Coverage Targets
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 95%+
- **Lines**: 90%+

## 🔗 Integration Testing

### API Endpoint Testing

#### Test Setup
```typescript
// tests/api/setup.ts
import { createClient } from '@supabase/supabase-js';
import { setupTestDatabase } from '../utils/testDb';

const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
);

beforeAll(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await teardownTestDatabase();
});
```

#### Example API Tests
```typescript
// tests/api/redeem.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/redeem/route';
import { createTestUser, createTestCode } from '../utils/testHelpers';

describe('/api/redeem', () => {
  it('should redeem valid code successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        code: 'VALID123',
        cashier_id: 'cashier-uuid'
      }
    });

    // Setup test data
    const user = await createTestUser({ role: 'cashier' });
    const code = await createTestCode({ status: 'ACTIVE' });

    // Mock authentication
    req.headers.authorization = `Bearer ${user.token}`;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.points_awarded).toBeGreaterThan(0);
  });

  it('should reject expired codes', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        code: 'EXPIRED123',
        cashier_id: 'cashier-uuid'
      }
    });

    const user = await createTestUser({ role: 'cashier' });
    const code = await createTestCode({ 
      status: 'EXPIRED',
      expires_at: new Date(Date.now() - 60000).toISOString()
    });

    req.headers.authorization = `Bearer ${user.token}`;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Code expired');
  });

  it('should enforce rate limiting', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { code: 'TEST123', cashier_id: 'cashier-uuid' }
    });

    const user = await createTestUser({ role: 'cashier' });
    req.headers.authorization = `Bearer ${user.token}`;

    // Make multiple requests quickly
    const promises = Array(11).fill(null).map(() => POST(req));
    const responses = await Promise.all(promises);

    const rateLimitedResponse = responses.find(r => r.status === 429);
    expect(rateLimitedResponse).toBeDefined();
  });
});
```

### Database Integration Testing
```typescript
// tests/integration/database.test.ts
import { supabase } from '@/lib/supabase/client';
import { awardPointsAndCheckMilestones } from '../utils/dbHelpers';

describe('Database Functions', () => {
  it('should award points and check milestones atomically', async () => {
    const user = await createTestUser({ points: 50 });
    const milestone = await createTestMilestone({ points_required: 100 });

    const result = await awardPointsAndCheckMilestones(user.id, 60);

    expect(result.new_total_points).toBe(110);
    expect(result.unlocked_milestones).toHaveLength(1);
    expect(result.unlocked_milestones[0].milestone_id).toBe(milestone.id);
  });

  it('should prevent duplicate milestone awards', async () => {
    const user = await createTestUser({ points: 100 });
    const milestone = await createTestMilestone({ points_required: 100 });

    // Award points multiple times
    await awardPointsAndCheckMilestones(user.id, 50);
    await awardPointsAndCheckMilestones(user.id, 50);

    const awards = await supabase
      .from('milestone_awards')
      .select('*')
      .eq('user_id', user.id)
      .eq('milestone_id', milestone.id);

    expect(awards.data).toHaveLength(1);
  });
});
```

## 🌐 End-to-End Testing

### Framework: Playwright

#### Test Configuration
```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' },
    },
  ],
};

export default config;
```

#### Example E2E Tests
```typescript
// tests/e2e/referral-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Referral Flow', () => {
  test('complete referral journey', async ({ page }) => {
    // 1. User creates referral invite
    await page.goto('/dashboard');
    await page.click('[data-testid="create-invite-btn"]');
    
    await page.fill('[data-testid="invite-title"]', 'Test Invite');
    await page.fill('[data-testid="invite-description"]', 'Test Description');
    await page.click('[data-testid="submit-invite"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // 2. Generate ephemeral code
    await page.click('[data-testid="generate-code-btn"]');
    await expect(page.locator('[data-testid="code-display"]')).toBeVisible();

    // 3. Copy code and simulate redemption
    const code = await page.locator('[data-testid="code-display"]').textContent();
    
    // 4. Switch to cashier view
    await page.goto('/cashier');
    await page.fill('[data-testid="code-input"]', code!);
    await page.click('[data-testid="redeem-btn"]');
    
    // 5. Verify redemption success
    await expect(page.locator('[data-testid="success-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="points-awarded"]')).toContainText('100');
  });

  test('code expiration handling', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Generate code
    await page.click('[data-testid="generate-code-btn"]');
    const code = await page.locator('[data-testid="code-display"]').textContent();
    
    // Wait for expiration (in test environment, use shorter TTL)
    await page.waitForTimeout(6000);
    
    // Try to redeem expired code
    await page.goto('/cashier');
    await page.fill('[data-testid="code-input"]', code!);
    await page.click('[data-testid="redeem-btn"]');
    
    await expect(page.locator('[data-testid="error-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('expired');
  });
});
```

## 📊 Performance Testing

### Load Testing with Artillery
```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "API Endpoints"
    weight: 70
    flow:
      - get:
          url: "/api/points/me"
          headers:
            Authorization: "Bearer {{ $randomString() }}"
      - think: 1
      - get:
          url: "/api/milestones/me"
          headers:
            Authorization: "Bearer {{ $randomString() }}"

  - name: "Code Redemption"
    weight: 30
    flow:
      - post:
          url: "/api/redeem"
          json:
            code: "{{ $randomString(8) }}"
            cashier_id: "{{ $uuid() }}"
```

### Performance Metrics
- **Response Time**: P95 < 500ms, P99 < 1000ms
- **Throughput**: Handle 1000+ requests/minute
- **Error Rate**: < 1% under normal load
- **Resource Usage**: CPU < 80%, Memory < 85%

## 🔒 Security Testing

### Vulnerability Assessment
```typescript
// tests/security/security.test.ts
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should prevent SQL injection', async ({ page }) => {
    const maliciousInput = "'; DROP TABLE profiles; --";
    
    await page.goto('/dashboard');
    await page.fill('[data-testid="search-input"]', maliciousInput);
    await page.click('[data-testid="search-btn"]');
    
    // Should not crash or expose database errors
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });

  test('should enforce authentication', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should prevent CSRF attacks', async ({ page }) => {
    // Test CSRF token validation
    const response = await page.request.post('/api/redeem', {
      data: { code: 'TEST123' },
      headers: { 'X-CSRF-Token': 'invalid-token' }
    });
    
    expect(response.status()).toBe(403);
  });
});
```

### Penetration Testing Checklist
- [ ] Authentication bypass attempts
- [ ] Authorization escalation
- [ ] Input validation bypass
- [ ] Session management attacks
- [ ] Rate limiting bypass
- [ ] SQL injection attempts
- [ ] XSS payload testing
- [ ] CSRF token validation

## 🚀 CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test & Quality Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 📈 Test Reporting

### Coverage Reports
- **HTML Coverage**: Detailed coverage reports in `coverage/` directory
- **Codecov Integration**: Online coverage tracking and reporting
- **Coverage Thresholds**: Fail builds if coverage drops below targets

### Test Results
- **Jest Reporter**: Console and HTML test results
- **Playwright Report**: Interactive HTML reports for E2E tests
- **Performance Metrics**: Response time and throughput analysis

## 🛠️ Testing Tools

### Development Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking and testing
- **Playwright**: E2E testing and automation

### Quality Tools
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for pre-commit checks

### Monitoring Tools
- **Codecov**: Coverage tracking
- **GitHub Actions**: CI/CD automation
- **Playwright Report**: Test result visualization

## 📋 Test Maintenance

### Regular Tasks
- **Daily**: Run unit tests on development
- **Weekly**: Run integration test suite
- **Bi-weekly**: Run full E2E test suite
- **Monthly**: Performance and security testing
- **Quarterly**: Test strategy review and updates

### Test Data Management
- **Test Database**: Isolated test environment
- **Fixtures**: Reusable test data sets
- **Cleanup**: Automatic test data cleanup
- **Seeding**: Database seeding for consistent tests

## 🎯 Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Clear test structure
2. **Descriptive Names**: Meaningful test descriptions
3. **Single Responsibility**: One assertion per test
4. **Test Isolation**: Independent test execution
5. **Realistic Data**: Use realistic test scenarios

### Test Organization
1. **Group Related Tests**: Use describe blocks effectively
2. **Shared Setup**: Extract common test utilities
3. **Test Data Factories**: Create test data builders
4. **Page Objects**: Organize E2E test selectors

### Performance Considerations
1. **Parallel Execution**: Run tests concurrently
2. **Test Database**: Use separate test database
3. **Mocking**: Mock external dependencies
4. **Cleanup**: Efficient test data cleanup

---

**Remember**: Good tests are like good documentation - they help others understand your code and prevent future bugs from being introduced.
