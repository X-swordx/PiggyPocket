import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DiningGroupService } from './dining-group.service';
import { CreateDiningGroupDto } from './dto/create-dining-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';

@ApiTags('饭搭子组')
@Controller('dining-groups')
export class DiningGroupController {
  constructor(private readonly diningGroupService: DiningGroupService) {}

  @Post()
  @ApiOperation({ summary: '创建新的饭搭子组' })
  create(@Body() createDiningGroupDto: CreateDiningGroupDto) {
    return this.diningGroupService.create(createDiningGroupDto);
  }

  @Get('my')
  @ApiOperation({ summary: '获取我加入的所有组' })
  @ApiQuery({ name: 'userId', description: '用户ID' })
  findMyGroups(@Query('userId', ParseIntPipe) userId: number) {
    return this.diningGroupService.findMyGroups(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取组详情（含成员列表）' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.diningGroupService.findOne(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: '通过 openid 添加成员' })
  addMember(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.diningGroupService.addMember(groupId, addMemberDto);
  }

  @Put(':id/nickname')
  @ApiOperation({ summary: '修改在组里的昵称' })
  updateNickname(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() updateNicknameDto: UpdateNicknameDto,
  ) {
    return this.diningGroupService.updateNickname(groupId, updateNicknameDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '移除成员' })
  removeMember(
    @Param('id', ParseIntPipe) groupId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.diningGroupService.removeMember(groupId, userId);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: '退出组' })
  @ApiQuery({ name: 'userId', description: '退出的用户ID' })
  leaveGroup(
    @Param('id', ParseIntPipe) groupId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.diningGroupService.leaveGroup(groupId, userId);
  }
}
