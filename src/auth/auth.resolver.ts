import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthDTO } from './auth.dto';
import { WhoAmIDTO } from './who-am-i.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthorizationGuard } from './gql-authorization.guard';
import { GqlAuth } from './gql-auth.decorator';

@Resolver('Auth')
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Query('whoAmI')
    @UseGuards(GqlAuthorizationGuard)
    async whoAmI(@GqlAuth() auth: AuthDTO): Promise<WhoAmIDTO> {
        return this.authService.whoAmI(auth.id);
    }

    @Mutation()
    async login(@Args('id') id: string, @Args('password') password: string): Promise<AuthDTO> {
        return await this.authService.login({ id, password});
    }
}
