import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(paginationDto: PaginationDto): Promise<{
        list: User[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: number): Promise<User>;
    findByOpenid(openid: string): Promise<User>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
