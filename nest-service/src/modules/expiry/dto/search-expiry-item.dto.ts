import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export type SearchExpiryStatus = "fresh" | "expiring" | "expired";

export class SearchExpiryItemDto {
  @ApiProperty({ description: "用户ID" })
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiProperty({ description: "搜索词，支持语义搜索" })
  @IsNotEmpty({ message: "搜索词不能为空" })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: "返回条数", default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  topK?: number;

  @ApiPropertyOptional({
    description: "状态过滤：fresh/expiring/expired，也可由搜索词自动推断",
  })
  @IsOptional()
  @IsIn(["fresh", "expiring", "expired"])
  status?: SearchExpiryStatus;
}
