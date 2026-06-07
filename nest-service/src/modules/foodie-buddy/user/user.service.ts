import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

interface WechatCodeSessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // 检查 openid 是否已存在
    const existing = await this.userRepository.findOne({
      where: { openid: createUserDto.openid },
    });
    if (existing) {
      return existing;
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async wechatLogin(wechatLoginDto: WechatLoginDto) {
    const appid = this.configService.get<string>('WECHAT_APPID');
    const secret = this.configService.get<string>('WECHAT_SECRET');
    if (!appid || !secret) {
      throw new BadRequestException('微信小程序配置缺失');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(wechatLoginDto.code)}&grant_type=authorization_code`;
    const response = await fetch(url);
    const session = (await response.json()) as WechatCodeSessionResponse;

    if (!response.ok || !session.openid) {
      throw new BadRequestException(session.errmsg || '微信登录失败');
    }

    return this.create({
      openid: session.openid,
      nickname: wechatLoginDto.nickname,
      avatar: wechatLoginDto.avatar,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.userRepository.findAndCount({
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    return user;
  }

  async findByOpenid(openid: string) {
    return await this.userRepository.findOne({ where: { openid } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { success: true };
  }
}
