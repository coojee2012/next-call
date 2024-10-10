// import { UseGuards } from '@nestjs/common';
import {
	Query,
	Mutation,
	Resolver,
	Subscription,
	Args,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

import { IProcess } from './interfaces/process.interface';
import { ProcessService } from './process.service';
import { Process } from './process.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { ProcessGuard } from './process.guard';
import { ParseIntPipe } from '@nestjs/common';

const pubSub = new PubSub();

@Resolver('Process')
export class ProcessResolver {

	constructor(
		@InjectRepository(Process)
		private readonly processRepository: Repository<Process>,
		private readonly processService: ProcessService) { }

	// @UseGuards(ProcessGuard)
	@Query()
	async processes() {
		return await this.processService.findAll();
	}

	@Query()
	async process(
		@Args('id', ParseIntPipe)
		id: number,
	): Promise<IProcess | null> {
		return await this.processService.findOneById(id);
	}

	@Mutation('processCreate')
	async create(@Args('input') process: IProcess): Promise<IProcess> {
		console.log('input', process);
		const processCreated = await this.processService.save(process);
		pubSub.publish('processCreated', { processCreated });
		return processCreated;
	}

	@Mutation('processUpdate')
	async update(@Args('input') process: IProcess): Promise<IProcess | null> {
		console.log('input>>>', process);
		const processId = process.id as number;
		await this.processRepository.update(processId, process);
		const processUpdated = await this.processRepository.findOneBy({id: processId});
		this.processService.socketClientsPublish(process);
		pubSub.publish('processUpdated', { processUpdated });
		return processUpdated;
	}

	@Mutation('processRemove')
	async remove(@Args('input') process: IProcess): Promise<boolean> {
		console.log('input', process);
		let success = false;
		try {
			const processId = process.id as number;
			const processRemoved = await this.processRepository.findOneBy({id: processId});
			await processRemoved?.remove();
			pubSub.publish('processRemoved', { processRemoved });
			success = true;
		} catch (e) {
			console.log('processRemove',e);
		}
		return success;
	}

	@Subscription('processCreated')
	procesCreated() {
		return {
			subscribe: () => pubSub.asyncIterator('processCreated'),
		};
	}
}