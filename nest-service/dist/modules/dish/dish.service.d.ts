import { Repository } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class DishService {
    private readonly dishRepository;
    constructor(dishRepository: Repository<Dish>);
    create(createDishDto: CreateDishDto): Promise<Dish>;
    findAll(paginationDto: PaginationDto, category?: string): Promise<{
        list: Dish[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: number): Promise<Dish>;
    update(id: number, updateDishDto: UpdateDishDto): Promise<Dish>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
