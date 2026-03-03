import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { BodyRequiredGuard } from "./guard/body-required.guard";
import { JwtAuthGuard } from "./guard/jwt-auth.guard";
import { RefreshUserTokensDto } from "./dto/refreshUserTokens.dto";
import { createUserDto } from "./dto/CreateUser.dto";
import { loginUserDto } from "./dto/loginUser.dto";
import type { AuthenticatedRequest } from "../common/AuthenticatedRequest";

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  /**
   * Handles user login authentication
   * @param loginUserDto - The login credentials containing username and password
   * @returns Promise resolving to authentication result with user data and token on success,
   *          or error response with status 400 if credentials are missing/invalid
   *
   * @example
   * ```
   * POST /auth/login
   * {
   *   "username": "cam",
   *   "password": "123456"
   * }
   * ```
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UseGuards(BodyRequiredGuard) // Checks input before hitting route
  async login(@Body() loginUserDto: loginUserDto): Promise<{ message: string; accessToken: string; refreshToken: string; user: { id: string; username: string; role: string }; token_type: string }> {
    const result = await this.authService.login(loginUserDto);
    return {
      ...result,
      token_type: "bearer",
    };
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BodyRequiredGuard) // Checks input before hitting route
  async register(@Body() createUserDto: createUserDto ): Promise<{ message: string; accessToken: string; refreshToken: string; user: { id: string; username: string; role: string }; token_type: string }> {
    const result = await this.authService.register(createUserDto);
    return {
      ...result,
      token_type: "bearer",
    };
  }

  /**
   * Refreshes the authentication tokens for a logged-in user
   * 
   * @param refreshTokenDto - The refresh token DTO containing the refresh token
   * @param req - The authenticated request object containing user information
   * @returns Promise resolving to refreshed tokens and user data with token type
   * @throws UnauthorizedException if refresh token is invalid or expired
   */
  @Patch("refresh")
  @HttpCode(HttpStatus.OK)
  @UseGuards(BodyRequiredGuard, JwtAuthGuard)
  async refresh(@Body() refreshTokenDto: RefreshUserTokensDto, @Request() req: AuthenticatedRequest) {
    const result = await this.authService.refresh(req, refreshTokenDto.refreshToken);
    return {
      ...result,
      token_type: "bearer",
    };
  }

  /**
   * Get current user information - requires authorization header with
   * valid JWT bearer token
   * @returns status 200 on success with user data
   * @throws UnauthorizedException if no valid JWT token is provided
   * @throws ForbiddenException if user does not have access (Should not happen)
   */
  @Get("me")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: AuthenticatedRequest): { data: { id: string; username: string; role: string } } {
    return {
      data: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
    };
  }
}
