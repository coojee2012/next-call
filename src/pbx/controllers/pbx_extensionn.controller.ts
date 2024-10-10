import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, Post, Put, Query, Req, UseInterceptors } from '@nestjs/common';
import { PbxExtensionnService } from '../services/pbx_extensionn.service';
import { Request } from 'express';
@Controller('pbx/extension')
@UseInterceptors(ClassSerializerInterceptor)
export class PbxExtensionnController {
    constructor(private readonly pbxExtensionnService: PbxExtensionnService) {}
    @Get()
    async list(@Req() req: Request, @Query('searchKey') searchKey: string): Promise<any> {
        const user = req.user as any;
        const {id, tenantId} = user
        return await this.pbxExtensionnService.list(tenantId, searchKey);
    }
    @Post()
    async create(@Req() req: Request, @Body() body: any): Promise<any> {
        const user = req.user as any;
        const {id, tenantId} = user
        const {accountCode,password} = body;
        return await this.pbxExtensionnService.create({
            tenantId,
            logicOptions: '{}', 
            accountCode, 
            password});
    }
    @Get(':id')
    async get(@Req() req: Request, @Param('id') id: string): Promise<any> {
        const user = req.user as any;
        const {id: userId, tenantId} = user
        return await this.pbxExtensionnService.findById(+id);
    }
    @Put(':id')
    async update(@Req() req: Request, @Param('id') id: string, @Body() body: any): Promise<any> {
        const user = req.user as any;
        const {id: userId, tenantId} = user
        return await this.pbxExtensionnService.update(+id, body);
    }
    @Delete(':id')
    async delete(@Req() req: Request, @Param('id') id: string): Promise<any> {
        const user = req.user as any;
        const {id: userId, tenantId} = user
        return await this.pbxExtensionnService.delete(+id);
    }
}
