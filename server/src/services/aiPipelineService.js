const LearningPlan = require('../models/LearningPlan');
const { TimeoutError, withTimeout } = require('../utils/withTimeout');

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 20000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class AIPipelineService {
  /**
   * Phase 1: Validate input according to pipeline task type
   */
  validateInput(type, payload = {}) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Pipeline input must be an object');
    }

    switch (type) {
      case 'roadmap': {
        const skill = String(payload.skill || payload.topic || '').trim();
        if (!skill) {
          throw new Error('Skill or topic is required for roadmap generation');
        }
        const weeklyHours = Number(payload.weeklyHours);
        if (payload.weeklyHours !== undefined && (Number.isNaN(weeklyHours) || weeklyHours <= 0)) {
          throw new Error('weeklyHours must be a positive number');
        }
        const targetWeeks = Number(payload.targetWeeks);
        if (payload.targetWeeks !== undefined && (Number.isNaN(targetWeeks) || targetWeeks <= 0)) {
          throw new Error('targetWeeks must be a positive number');
        }
        return {
          skill,
          learnerLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(payload.learnerLevel)
            ? payload.learnerLevel
            : 'Beginner',
          weeklyHours: weeklyHours > 0 ? weeklyHours : 5,
          targetWeeks: targetWeeks > 0 ? targetWeeks : 4,
          focusAreas: Array.isArray(payload.focusAreas) ? payload.focusAreas.filter(Boolean) : [],
          planId: payload.planId ? String(payload.planId).trim() : null,
          savePlan: Boolean(payload.savePlan),
        };
      }

      case 'chat': {
        const message = String(payload.message || '').trim();
        if (!message) {
          throw new Error('Message is required for chat');
        }
        return {
          message,
          context: payload.context || {},
          history: Array.isArray(payload.history) ? payload.history : [],
        };
      }

      case 'studioTool': {
        const tool = String(payload.tool || '').trim();
        if (!tool) {
          throw new Error('Tool type is required for studio generation');
        }
        return {
          tool,
          params: payload.params || {},
        };
      }

      default:
        return payload;
    }
  }

  /**
   * Phase 2: Build structured prompt for LLM provider
   */
  buildPrompt(type, validatedInput) {
    switch (type) {
      case 'roadmap': {
        return [
          `You are an expert curriculum designer and AI learning mentor.`,
          `Create a structured learning roadmap for: "${validatedInput.skill}"`,
          `Target Level: ${validatedInput.learnerLevel}`,
          `Estimated Weekly Hours: ${validatedInput.weeklyHours}`,
          `Target Weeks: ${validatedInput.targetWeeks}`,
          validatedInput.focusAreas.length > 0
            ? `Special Focus Areas: ${validatedInput.focusAreas.join(', ')}`
            : '',
          `Return ONLY valid, parseable JSON adhering to this exact schema:`,
          `{`,
          `  "title": "Clear curriculum title",`,
          `  "description": "2-3 sentence overview",`,
          `  "targetLevel": "${validatedInput.learnerLevel}",`,
          `  "estimatedWeeks": ${validatedInput.targetWeeks},`,
          `  "milestones": [`,
          `    {`,
          `      "milestoneNumber": 1,`,
          `      "title": "Milestone title",`,
          `      "summary": "Summary of what is learned",`,
          `      "keyTopics": ["topic 1", "topic 2"],`,
          `      "practiceTasks": ["task 1", "task 2"],`,
          `      "recommendedHours": 5`,
          `    }`,
          `  ]`,
          `}`,
        ]
          .filter(Boolean)
          .join('\n');
      }

      case 'chat': {
        return [
          `You are an AI study mentor on the CollabLearn collaborative learning platform.`,
          `Respond with practical, supportive, and pedagogically sound explanations.`,
          `User inquiry: "${validatedInput.message}"`,
        ].join('\n');
      }

      default:
        return JSON.stringify(validatedInput);
    }
  }

  /**
   * Phase 3: Execute provider with timeout, retry backoff, and graceful fallback
   */
  async executeProviderWithRetry(providerFn, options = {}) {
    const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : MAX_RETRIES;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await withTimeout(
          async () => providerFn(),
          timeoutMs,
          `AI Provider timed out after ${timeoutMs}ms`
        );
        const latencyMs = Date.now() - startTime;
        return {
          success: true,
          data: result,
          latencyMs,
          retries: attempt,
        };
      } catch (err) {
        lastError = err;
        const isQuota =
          String(err.message || '').includes('429') ||
          String(err.message || '').includes('quota') ||
          String(err.message || '').includes('resource_exhausted');

        // Do not retry indefinitely on quota exhaustion
        if (isQuota && attempt >= 1) {
          break;
        }

        if (attempt < maxRetries) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    return {
      success: false,
      error: lastError,
      retries: maxRetries,
    };
  }

  /**
   * Phase 4: Validate structured output (JSON parse, structure integrity)
   */
  validateStructuredOutput(type, rawOutput) {
    if (!rawOutput) {
      throw new Error('Received empty response from AI provider');
    }

    if (typeof rawOutput === 'object' && rawOutput !== null) {
      return rawOutput;
    }

    const text = String(rawOutput).trim();
    // Clean markdown code blocks if provider returned ```json ... ```
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const cleanedText = jsonMatch ? jsonMatch[1].trim() : text;

    try {
      const parsed = JSON.parse(cleanedText);
      return parsed;
    } catch (parseErr) {
      throw new Error(`Failed to parse AI output as JSON: ${parseErr.message}`);
    }
  }

  /**
   * Phase 5: Normalize response into standard CollabLearn contract
   */
  normalizeResponse(type, structuredData, context = {}) {
    switch (type) {
      case 'roadmap': {
        const milestones = Array.isArray(structuredData.milestones)
          ? structuredData.milestones.map((m, idx) => ({
              milestoneNumber: Number(m.milestoneNumber) || idx + 1,
              title: String(m.title || `Milestone ${idx + 1}`).trim(),
              summary: String(m.summary || m.description || '').trim(),
              keyTopics: Array.isArray(m.keyTopics) ? m.keyTopics.map(String) : [],
              practiceTasks: Array.isArray(m.practiceTasks) ? m.practiceTasks.map(String) : [],
              recommendedHours: Number(m.recommendedHours) || 4,
              resources: Array.isArray(m.resources) ? m.resources : [],
              videos: Array.isArray(m.videos) ? m.videos : [],
            }))
          : [];

        return {
          title: String(structuredData.title || `${context.skill || 'Skill'} Learning Path`).trim(),
          description: String(
            structuredData.description ||
              'Custom structured curriculum designed for your learning goals.'
          ).trim(),
          targetLevel: structuredData.targetLevel || context.learnerLevel || 'Beginner',
          estimatedWeeks:
            Number(structuredData.estimatedWeeks) || context.targetWeeks || milestones.length || 4,
          milestones,
        };
      }

      default:
        return structuredData;
    }
  }

  /**
   * Phase 6: Persist result to MongoDB if requested
   */
  async persistResult(type, { userId, data, planId, source = 'ai', skill = '' }) {
    if (!userId) return null;

    if (type === 'roadmap') {
      try {
        if (planId) {
          const existing = await LearningPlan.findOne({ _id: planId, user: userId });
          if (existing) {
            existing.skill = skill || data.title || existing.skill;
            existing.milestones = data.milestones;
            existing.source = source;
            existing.progressPercentage = 0;
            existing.completedStepIndexes = [];
            await existing.save();
            return String(existing._id);
          }
        }

        const newPlan = await LearningPlan.create({
          user: userId,
          skill: skill || data.title || 'Learning Roadmap',
          milestones: data.milestones,
          source,
          progressPercentage: 0,
          completedStepIndexes: [],
        });
        return String(newPlan._id);
      } catch (err) {
        console.error('[AI Pipeline] Failed to persist learning plan:', err.message);
        return null;
      }
    }

    return null;
  }

  /**
   * End-to-end pipeline execution runner
   */
  async executePipeline({ type, payload, userId = null, providerFn, fallbackFn, onProgress }) {
    // 1. Validate input
    const validatedInput = this.validateInput(type, payload);
    if (typeof onProgress === 'function') onProgress('input_validated', validatedInput);

    // 2. Build prompt
    const prompt = this.buildPrompt(type, validatedInput);
    if (typeof onProgress === 'function')
      onProgress('prompt_built', { promptLength: prompt.length });

    // 3. Execute provider with timeout / retry
    let providerResult = null;
    let source = 'fallback';
    let outputData = null;

    if (typeof providerFn === 'function') {
      providerResult = await this.executeProviderWithRetry(providerFn);
      if (providerResult.success && providerResult.data) {
        try {
          // 4. Validate structured output
          const parsed = this.validateStructuredOutput(type, providerResult.data);
          // 5. Normalize response
          outputData = this.normalizeResponse(type, parsed, validatedInput);
          source = 'ai';
        } catch (_formatError) {
          // Fall back if formatting/parsing failed
          outputData = null;
        }
      }
    }

    // Use fallback if remote provider failed or was not provided
    if (!outputData && typeof fallbackFn === 'function') {
      const fallbackRaw = await fallbackFn(validatedInput);
      outputData = this.normalizeResponse(type, fallbackRaw, validatedInput);
      source = 'fallback';
    }

    // 6. Persist result if requested
    let savedPlanId = null;
    if (validatedInput.savePlan || validatedInput.planId) {
      savedPlanId = await this.persistResult(type, {
        userId,
        data: outputData,
        planId: validatedInput.planId,
        source,
        skill: validatedInput.skill,
      });
    }

    return {
      success: true,
      data: outputData,
      source,
      savedPlanId,
      telemetry: {
        latencyMs: providerResult?.latencyMs || 0,
        retries: providerResult?.retries || 0,
        providerSuccess: Boolean(providerResult?.success),
      },
    };
  }
}

const aiPipelineService = new AIPipelineService();

module.exports = {
  aiPipelineService,
  AIPipelineService,
};
