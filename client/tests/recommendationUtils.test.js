import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFallbackRecommendations,
  getDeterministicRecommendationScore,
} from '../src/utils/recommendationUtils.js';

test('getDeterministicRecommendationScore favors higher quality skills without randomness', () => {
  const premiumSkill = {
    offering: {
      rating: 4.9,
      sessions: 42,
      price: 0,
    },
  };

  const baselineSkill = {
    offering: {
      rating: 4.1,
      sessions: 3,
      price: 1200,
    },
  };

  assert.ok(getDeterministicRecommendationScore(premiumSkill) > getDeterministicRecommendationScore(baselineSkill));
});

test('buildFallbackRecommendations sorts by deterministic score and annotates reasons', () => {
  const results = buildFallbackRecommendations([
    {
      _id: 'skill-1',
      offering: { rating: 4.2, sessions: 12, price: 800 },
    },
    {
      _id: 'skill-2',
      offering: { rating: 4.8, sessions: 24, price: 0 },
    },
  ]);

  assert.equal(results[0]._id, 'skill-2');
  assert.equal(results[0].recommendationReason, 'priceCompatibility');
  assert.ok(results[0].recommendationScore >= results[1].recommendationScore);
});
