import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, Post, Put, Query, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { PbxIvrMenmuService } from '../services/pbx_ivr_menmu.service';
import { PbxIvrMenmu } from '../entities/pbx_ivr_menmu';
@Controller('pbx/ivr')
@UseInterceptors(ClassSerializerInterceptor)
export class PbxIvrMenmuController {
    constructor(private readonly pbxIvrMenmuService: PbxIvrMenmuService) {}

    @Get('')
    async getList(@Req() req: Request,  @Query('searchKey') searchKey: string): Promise<PbxIvrMenmu[]> {
        const { tenantId } = req.user as any;
        return await this.pbxIvrMenmuService.listSearch(
            searchKey,
            ['ivrNumber','ivrName'],
            {tenantId}
        );
    }
    @Post()
    async create(@Req() req: Request, @Body() body: any): Promise<PbxIvrMenmu> {
        const user = req.user as any;
        const {tenantId} = user
        const {ivrNumber,ivrName, description} = body;
        return await this.pbxIvrMenmuService.create({
            tenantId,
            ivrNumber, 
            ivrName, 
            description});
    }
    @Put(':id')
    async update(@Req() req: Request, @Param('id') id: number, @Body() body: any): Promise<PbxIvrMenmu | null> {
        const user = req.user as any;
        const {tenantId} = user
        const {ivrNumber,ivrName, description} = body;
        return await this.pbxIvrMenmuService.updateOne({id, tenantId}, {
            ivrName, 
            description});
    }

    @Delete(':id')
    async delete(@Req() req: Request, @Param('id') id: number): Promise<any> {
        const user = req.user as any;
        const {tenantId} = user
        return await this.pbxIvrMenmuService.deleteBy({id,tenantId});    
    }
}
