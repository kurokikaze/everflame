import { Dictionary, EntityManager } from '@mikro-orm/core';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, LoggerService, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { isNull, isUndefined } from './utils/validation.util';
import { IMessage } from 'src/types/imessage.interface';
import { v4 } from 'uuid';
import slugify from 'slugify';

@Injectable()
export class CommonService {
    private readonly loggerService: LoggerService;

    constructor() {
        this.loggerService = new Logger(CommonService.name);
    }

    /**
   * Validate Entity
   *
   * Validates an entities with the class-validator library
   */
    public async validateEntity(entity: Dictionary): Promise<void> {
        const errors = await validate(entity);
        const messages: string[] = [];

        for (const error of errors) {
            messages.push(...Object.values(error.constraints));
        }

        if (errors.length > 0) {
            throw new BadRequestException(messages.join(',\n'));
        }
    }

    /**
   * Throw Duplicate Error
   *
   * Checks is an error is of the code 23505, PostgreSQL's duplicate value error,
   * and throws a conflict exception
   */
    public async throwDuplicateError<T>(promise: Promise<T>, message?: string) {
        try {
            return await promise;
        } catch (error) {
            this.loggerService.error(error);

            if (error.code === '23505') {
                throw new ConflictException(message ?? 'Duplicated value in database');
            }

            throw new BadRequestException(error.message);
        }
    }

    /**
     * Throw Internal Error
     *
     * Function to abstract throwing internal server exception
     */
    public async throwInternalError<T>(promise: Promise<T>): Promise<T> {
        try {
            return await promise;
        } catch (error) {
            this.loggerService.error(error);
            throw new InternalServerErrorException(error);
        }
    }

    /**
   * Check Entity Existence
   *
   * Checks if a findOne query didn't return null or undefined
   */
    public checkEntityExistence<T extends Dictionary>(
        entity: T | null | undefined,
        name: string,
    ): void {
        if (isNull(entity) || isUndefined(entity)) {
            throw new NotFoundException(`${name} not found`);
        }
    }

    /**
     * Save Entity
     *
     * Validates, saves and flushes entities into the DB
     */
    public async saveEntity<T extends Dictionary>(
        em: EntityManager,
        entity: T,
        isNew = false,
    ): Promise<void> {
        await this.validateEntity(entity);

        if (isNew) {
            em.persist(entity);
        }

        await this.throwDuplicateError(em.flush());
    }

    /**
     * Remove Entity
     *
     * Removes an entities from the DB.
     */
    public async removeEntity<T extends Dictionary>(
        em: EntityManager,
        entity: T,
    ): Promise<void> {
        await this.throwInternalError(em.removeAndFlush(entity));
    }

    /**
   * Format Name
   *
   * Takes a string trims it and capitalizes every word
   */
    public formatName(title: string): string {
        return title
            .trim()
            .replace(/\n/g, ' ')
            .replace(/\s\s+/g, ' ')
            .replace(/\w\S*/g, (w) => w.replace(/^\w/, (l) => l.toUpperCase()));
    }

    /**
     * Generate Point Slug
     *
     * Takes a string and generates a slug with dtos as word separators
     */
    public generatePointSlug(str: string): string {
        return slugify(str, { lower: true, replacement: '.', remove: /['_\.\-]/g });
    }

    public generateMessage(message: string): IMessage {
        return { id: v4(), message };
    }

    
}


