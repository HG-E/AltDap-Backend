import { Injectable } from '@nestjs/common';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';

@Injectable()
export class AssessmentsService {
  private readonly questionSet = {
    id: 'v1',
    version: 1,
    questions: [
      { id: 'q1', prompt: 'How are you feeling today?', type: 'scale' },
      { id: 'q2', prompt: 'What goal matters most this week?', type: 'text' },
    ],
  };

  getQuestions() {
    return this.questionSet;
  }

  submitResponses(payload: SubmitAssessmentDto) {
    return {
      responseId: 'resp_' + payload.versionId,
      recommendations: [
        { type: 'course', id: 'course_resilience', reason: 'Emotional regulation' },
        { type: 'challenge', id: 'challenge_daily_gratitude', reason: 'Consistency boost' },
      ],
    };
  }

  getResponseDetail(id: string) {
    return {
      id,
      versionId: this.questionSet.id,
      answers: this.questionSet.questions.map((question) => ({ questionId: question.id, value: 'sample' })),
      createdAt: new Date().toISOString(),
    };
  }

  getRecommendations(query: PaginationQueryDto) {
    const items = [
      { id: 'course_mindfulness', type: 'course', score: 0.92 },
      { id: 'challenge_30day', type: 'challenge', score: 0.81 },
    ];
    return paginate(items, items.length, query);
  }
}