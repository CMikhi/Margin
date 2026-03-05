import { IsOptional, MaxLength, IsString } from "class-validator";

export class RefreshUserTokensDto {
  @IsOptional()
  @IsString({ message: "Refresh token must be a string" })
  @MaxLength(512, { message: "Refresh token must be less than 512 characters" })
  readonly refreshToken?: string;
}
