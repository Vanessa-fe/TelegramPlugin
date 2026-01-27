import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { Public } from '../auth/decorators/public.decorator';
import { StorefrontService } from './storefront.service';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('products/:id')
  @Public()
  async getProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    const product = await this.storefrontService.getPublicProduct(id);
    if (!product) {
      throw new NotFoundException('Produit introuvable');
    }
    return product;
  }

  @Get('organizations/:slug')
  @Public()
  async getOrganizationBySlug(@Param('slug') slug: string) {
    const organization =
      await this.storefrontService.getPublicOrganization(slug);
    if (!organization) {
      throw new NotFoundException('Organisation introuvable');
    }
    return organization;
  }

  @Get('organizations/:slug/products')
  @Public()
  async getOrganizationProducts(@Param('slug') slug: string) {
    return this.storefrontService.getPublicProductsByOrganization(slug);
  }
}
