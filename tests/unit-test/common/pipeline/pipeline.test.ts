/* eslint-disable max-lines-per-function */
import { describe, it, expect, vi } from 'vitest';

import { Pipeline } from '@/common/lambda/pipeline';
import type { NextFunction, PipeFunction, PipeObject } from '@/common/lambda/pipeline';

describe('Pipeline', () => {
  describe('send()', () => {
    it('should set the passable data and return this for chaining', () => {
      const pipeline = new Pipeline<string>();
      const data = 'test data';

      const result = pipeline.send(data);

      expect(result).toBe(pipeline);
    });

    it('should accept any type of data', () => {
      const pipeline = new Pipeline<{ name: string; age: number }>();
      const data = { name: 'John', age: 30 };

      const result = pipeline.send(data);

      expect(result).toBe(pipeline);
    });
  });

  describe('through()', () => {
    it('should accept an array of pipes and return this for chaining', () => {
      const pipeline = new Pipeline<string>();
      const pipes = [(data: string, next: NextFunction<string>) => next(data)];

      const result = pipeline.through(pipes);

      expect(result).toBe(pipeline);
    });

    it('should accept a single pipe and convert it to an array', () => {
      const pipeline = new Pipeline<string>();
      const pipe = (data: string, next: NextFunction<string>) => next(data);

      const result = pipeline.through(pipe);

      expect(result).toBe(pipeline);
    });
  });

  describe('via()', () => {
    it('should set the method name and return this for chaining', () => {
      const pipeline = new Pipeline<string>();
      const methodName = 'process';

      const result = pipeline.via(methodName);

      expect(result).toBe(pipeline);
    });

    it('should default to "handle" method', async () => {
      const mockPipe: PipeObject<string> = {
        handle: vi.fn((data: string, next: NextFunction<string>) => next(data)),
      };

      const result = await new Pipeline<string>()
        .send('test')
        .through([mockPipe])
        .then((data) => data);

      expect(mockPipe.handle).toHaveBeenCalled();
      expect(result).toBe('test');
    });

    it('should use custom method name when via() is called', async () => {
      const mockPipe: PipeObject<string> = {
        process: vi.fn((data: string, next: NextFunction<string>) => next(data)),
      };

      const result = await new Pipeline<string>()
        .send('test')
        .through([mockPipe])
        .via('process')
        .then((data) => data);

      expect((mockPipe as Record<string, any>)['process']).toHaveBeenCalled();
      expect(result).toBe('test');
    });
  });

  describe('then()', () => {
    it('should throw error if send() was not called', () => {
      const pipeline = new Pipeline<string>();
      const pipe = (data: string, next: NextFunction<string>) => next(data);

      expect(() => pipeline.through([pipe]).then((data) => data)).toThrow(
        'Pipeline passable is not set. Call send() before then().',
      );
    });

    it('should process data through function pipes', async () => {
      const pipe1: PipeFunction<string> = (data, next) => next(data.toUpperCase());
      const pipe2: PipeFunction<string> = (data, next) => next(data + '!');

      const result = await new Pipeline<string>()
        .send('hello')
        .through([pipe1, pipe2])
        .then((data) => data);

      expect(result).toBe('HELLO!');
    });

    it('should process data through object pipes', async () => {
      const pipe1: PipeObject<string> = {
        handle: (data, next) => next(data.toUpperCase()),
      };
      const pipe2: PipeObject<string> = {
        handle: (data, next) => next(data + '!'),
      };

      const result = await new Pipeline<string>()
        .send('hello')
        .through([pipe1, pipe2])
        .then((data) => data);

      expect(result).toBe('HELLO!');
    });

    it('should process data through mixed pipes (functions and objects)', async () => {
      const pipe1: PipeFunction<string> = (data, next) => next(data.toUpperCase());
      const pipe2: PipeObject<string> = {
        handle: (data, next) => next(data + '!'),
      };

      const result = await new Pipeline<string>()
        .send('hello')
        .through([pipe1, pipe2])
        .then((data) => data);

      expect(result).toBe('HELLO!');
    });

    it('should support async operations in pipes', async () => {
      const asyncPipe1: PipeFunction<string> = async (data, next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return next(data.toUpperCase());
      };
      const asyncPipe2: PipeFunction<string> = async (data, next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return next(data + '!');
      };

      const result = await new Pipeline<string>()
        .send('hello')
        .through([asyncPipe1, asyncPipe2])
        .then((data) => data);

      expect(result).toBe('HELLO!');
    });

    it('should execute pipes in correct order (right to left in chain)', async () => {
      const executionOrder: string[] = [];

      const pipe1: PipeFunction<string> = (data, next) => {
        executionOrder.push('pipe1');
        return next(data + '1');
      };
      const pipe2: PipeFunction<string> = (data, next) => {
        executionOrder.push('pipe2');
        return next(data + '2');
      };
      const pipe3: PipeFunction<string> = (data, next) => {
        executionOrder.push('pipe3');
        return next(data + '3');
      };

      await new Pipeline<string>()
        .send('start')
        .through([pipe1, pipe2, pipe3])
        .then((data) => {
          executionOrder.push('destination');
          return data;
        });

      expect(executionOrder).toEqual(['pipe1', 'pipe2', 'pipe3', 'destination']);
    });

    it('should pass data through final destination callback', async () => {
      const destination = vi.fn((data: string) => data + '_final');

      const result = await new Pipeline<string>()
        .send('test')
        .through([(data, next) => next(data + '_processed')])
        .then(destination);

      expect(destination).toHaveBeenCalledWith('test_processed');
      expect(result).toBe('test_processed_final');
    });

    it('should handle complex object transformations', async () => {
      interface User {
        name: string;
        age: number;
      }

      const pipe1 = (user: User, next: NextFunction<User>) => {
        return next({ ...user, age: user.age + 1 });
      };
      const pipe2 = (user: User, next: NextFunction<User>) => {
        return next({ ...user, name: user.name.toUpperCase() });
      };

      const result = await new Pipeline<User>()
        .send({ name: 'john', age: 30 })
        .through([pipe1, pipe2])
        .then((user) => user);

      expect(result).toEqual({ name: 'JOHN', age: 31 });
    });

    it('should support type transformation', async () => {
      const pipe: PipeFunction<string, number> = (data, next) => {
        return next(data.length);
      };

      const result = await new Pipeline<string, number>()
        .send('hello')
        .through([pipe])
        .then((data) => data);

      expect(result).toBe(5);
      expect(typeof result).toBe('number');
    });

    it('should throw error if pipe is not function or valid object', async () => {
      const invalidPipe = { invalid: true };

      await expect(
        new Pipeline<string>()
          .send('test')
          .through([invalidPipe as any])
          .then((data) => data),
      ).rejects.toThrow("Pipe must be a function or an object with a 'handle' method.");
    });

    it('should handle empty pipes array', async () => {
      const result = await new Pipeline<string>()
        .send('test')
        .through([])
        .then((data) => data);

      expect(result).toBe('test');
    });

    it('should handle single pipe', async () => {
      const pipe = (data: string, next: NextFunction<string>) => next(data + '_modified');

      const result = await new Pipeline<string>()
        .send('test')
        .through([pipe])
        .then((data) => data);

      expect(result).toBe('test_modified');
    });
  });

  describe('thenReturn()', () => {
    it('should process data and return it without transformation', async () => {
      const pipe = (data: string, next: NextFunction<string>) => next(data + '_modified');

      const result = await new Pipeline<string>().send('test').through([pipe]).thenReturn();

      expect(result).toBe('test_modified');
    });

    it('should be equivalent to then() with identity function', async () => {
      const pipe = (data: number, next: NextFunction<number>) => next(data * 2);

      const result = await new Pipeline<number>().send(5).through([pipe]).thenReturn();

      expect(result).toBe(10);
    });

    it('should throw error if send() was not called', async () => {
      const pipeline = new Pipeline<string>();
      const pipe = (data: string, next: NextFunction<string>) => next(data);

      await expect(() => pipeline.through([pipe]).thenReturn()).rejects.toThrow(
        'Pipeline passable is not set. Call send() before then().',
      );
    });
  });

  describe('method chaining', () => {
    it('should support fluent interface', async () => {
      const result = await new Pipeline<string>()
        .send('test')
        .through([(data, next) => next(data.toUpperCase())])
        .then((data) => data);

      expect(result).toBe('TEST');
    });

    it('should allow calling methods in any order (except then)', async () => {
      const pipe = (data: string, next: NextFunction<string>) => next(data + '!');

      const result = await new Pipeline<string>()
        .through([pipe])
        .send('hello')
        .then((data) => data);

      expect(result).toBe('hello!');
    });

    it('should allow via() to be called between through() and then()', async () => {
      const pipe: PipeObject<string> = {
        process: (data, next) => next(data.toUpperCase()),
      };

      const result = await new Pipeline<string>()
        .send('test')
        .through([pipe])
        .via('process')
        .then((data) => data);

      expect(result).toBe('TEST');
    });
  });

  describe('generic types', () => {
    it('should preserve input type through pipes', async () => {
      interface Data {
        value: string;
      }

      const result = await new Pipeline<Data>()
        .send({ value: 'test' })
        .through([(data, next) => next(data)])
        .then((data) => data);

      expect(result).toEqual({ value: 'test' });
    });

    it('should support input and output type transformation', async () => {
      const pipe: PipeFunction<string, number> = (data, next) => {
        return next(data.length);
      };
      const pipe2: PipeFunction<number, string> = (data, next) => {
        return next(data.toString());
      };

      const result = await new Pipeline<string, string>()
        .send('hello')
        .through([pipe, pipe2])
        .then((data) => data);

      expect(result).toBe('5');
    });
  });

  describe('error handling', () => {
    it('should propagate errors thrown in pipes', async () => {
      const errorPipe = () => {
        throw new Error('Pipe error');
      };

      await expect(
        new Pipeline<string>()
          .send('test')
          .through([errorPipe as any])
          .then((data) => data),
      ).rejects.toThrow('Pipe error');
    });

    it('should propagate errors thrown in destination', async () => {
      // When destination throws, it should be caught as a promise rejection
      const destinationFn = async () => {
        throw new Error('Destination error');
      };

      await expect(
        new Pipeline<string>()
          .send('test')
          .through([])
          .then(() => destinationFn()),
      ).rejects.toThrow('Destination error');
    });

    it('should propagate async errors in pipes', async () => {
      const asyncErrorPipe = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async pipe error');
      };

      await expect(
        new Pipeline<string>()
          .send('test')
          .through([asyncErrorPipe as any])
          .then((data) => data),
      ).rejects.toThrow('Async pipe error');
    });
  });

  describe('real-world scenarios', () => {
    it('should work with request/response transformation pipeline', async () => {
      interface Request {
        body: string;
      }

      interface Response {
        body: string;
        timestamp: number;
      }

      const sanitizePipe = (req: Request, next: NextFunction<Request>) => {
        return next({ ...req, body: req.body.trim() });
      };

      const enrichPipe = (req: Request, next: NextFunction<Request>) => {
        return next(req);
      };

      const result = await new Pipeline<Request, Response>()
        .send({ body: '  test data  ' })
        .through([sanitizePipe, enrichPipe])
        .then((req) => ({
          body: req.body,
          timestamp: Date.now(),
        }));

      expect(result.body).toBe('test data');
      expect(typeof result.timestamp).toBe('number');
    });

    it('should work with validation pipeline', async () => {
      interface User {
        name: string;
        email: string;
      }

      const validateNamePipe = (user: User, next: NextFunction<User>) => {
        if (!user.name) throw new Error('Name is required');
        return next(user);
      };

      const validateEmailPipe = (user: User, next: NextFunction<User>) => {
        if (!user.email) throw new Error('Email is required');
        return next(user);
      };

      const validUser = { name: 'John', email: 'john@example.com' };
      const result = await new Pipeline<User>()
        .send(validUser)
        .through([validateNamePipe, validateEmailPipe])
        .then((user) => user);

      expect(result).toEqual(validUser);
    });

    it('should work with logging and transformation pipeline', async () => {
      const logs: string[] = [];

      const loggingPipe = (data: string, next: NextFunction<string>) => {
        logs.push(`Processing: ${data}`);
        return next(data);
      };

      const transformPipe = (data: string, next: NextFunction<string>) => {
        logs.push('Transforming...');
        return next(data.toUpperCase());
      };

      const result = await new Pipeline<string>()
        .send('test')
        .through([loggingPipe, transformPipe])
        .then((data) => {
          logs.push('Destination reached');
          return data;
        });

      expect(result).toBe('TEST');
      expect(logs).toEqual(['Processing: test', 'Transforming...', 'Destination reached']);
    });
  });
});
