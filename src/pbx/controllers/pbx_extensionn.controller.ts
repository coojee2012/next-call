import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, Post, Put, Query, Req, UseInterceptors } from '@nestjs/common';
import { PbxExtensionnService } from '../services/pbx_extensionn.service';
import { Request } from 'express';
import { PbxExtensionn } from '../entities/pbx_extensionn';
import { Pbx } from '../entities/pbx.entity';
@Controller('pbx/extension')
@UseInterceptors(ClassSerializerInterceptor)
export class PbxExtensionnController {
    constructor(private readonly pbxExtensionnService: PbxExtensionnService) {}
    @Get()
    async list(@Req() req: Request, @Query('searchKey') searchKey: string): Promise<PbxExtensionn[]> {
        const user = req.user as any;
        const {id, tenantId} = user
        return await this.pbxExtensionnService.list(tenantId, searchKey);
    }
    @Post()
    async create(@Req() req: Request, @Body() body: any): Promise<PbxExtensionn> {
        const user = req.user as any;
        const {id, tenantId} = user
        const {accountCode,password} = body;
        return await this.pbxExtensionnService.create({
            tenantId,
            logicOptions: '{}', 
            accountCode, 
            password});
    }

    @Post('batch')
    async batchCreate(@Req() req: Request, @Body() body: any): Promise<PbxExtensionn[]> {
        const user = req.user as any;
        const {id, tenantId} = user
        const {accountCodes,password} = body;
        return await this.pbxExtensionnService.batchCreate(tenantId, accountCodes, password);
    }

    @Get(':id')
    async get(@Req() req: Request, @Param('id') id: string): Promise<PbxExtensionn | null> {
        const user = req.user as any;
        const {tenantId} = user
        return await this.pbxExtensionnService.findOne({id: +id, tenantId});
    }
    @Put(':id')
    async update(@Req() req: Request, @Param('id') id: string, @Body() body: any): Promise<PbxExtensionn | null> {
        const user = req.user as any;
        const {id: userId, tenantId} = user
        return await this.pbxExtensionnService.updateOne({id: +id, tenantId}, body);
    }

    @Delete(':id')
    async delete(@Req() req: Request, @Param('id') id: string): Promise<number> {
        const user = req.user as any;
        const { tenantId } = user
        return await this.pbxExtensionnService.deleteBy({id: +id, tenantId});
    }
}
