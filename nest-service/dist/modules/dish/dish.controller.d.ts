import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class DishController {
    private readonly dishService;
    constructor(dishService: DishService);
    create(createDishDto: CreateDishDto): Promise<import("./entities/dish.entity").Dish>;
    findAll(paginationDto: PaginationDto, category?: string): Promise<{
        list: import("./entities/dish.entity").Dish[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: number): Promise<import("./entities/dish.entity").Dish>;
    update(id: number, updateDishDto: UpdateDishDto): Promise<import("./entities/dish.entity").Dish>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
