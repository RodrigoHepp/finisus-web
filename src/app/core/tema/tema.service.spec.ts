import { TestBed } from '@angular/core/testing';

import { TemaService } from './tema.service';

describe('TemaService', () => {
  let service: TemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemaService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });
});
