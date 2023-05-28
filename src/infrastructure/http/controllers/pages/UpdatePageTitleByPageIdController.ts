import { PageNotFoundError } from '@application/errors/PageNotFoundError';
import { HttpRequest } from '@infrastructure/http/interfaces/HttpRequest';
import { HttpResponse } from '@infrastructure/http/interfaces/HttpResponse';
import { BaseController } from '@infrastructure/http/controllers/BaseController';
import { Validation } from '@infrastructure/http/interfaces/Validation';
import { GetPageByIdInterface } from '@application/interfaces/use-cases/pages/getPageByIdInterface';
import { UpdatePageTitleByPageIdInterface } from '@application/interfaces/use-cases/pages/updatePageTitleByPageIdInterface';
import { noContent, notFound } from '@infrastructure/http/helpers/http';

export namespace UpdatePageTitleByPageIdController {
  export type Request = HttpRequest<{ title: string }, { pageId: string }>;
  export type Response = HttpResponse<undefined | PageNotFoundError>;
}

export class UpdatePageTitleByPageIdController extends BaseController {
  constructor(
    private readonly updatePageTitleByPageIdValidation: Validation,
    private readonly getPageById: GetPageByIdInterface,
    private readonly updatePageTitleByPageId: UpdatePageTitleByPageIdInterface
  ) {
    super(updatePageTitleByPageIdValidation);
  }

  async execute(
    httpRequest: UpdatePageTitleByPageIdController.Request
  ): Promise<UpdatePageTitleByPageIdController.Response> {
    const { pageId } = httpRequest.params!;
    const { title } = httpRequest.body!;

    const pageOrError = await this.getPageById.execute(pageId);

    if (pageOrError instanceof PageNotFoundError) {
      return notFound(pageOrError);
    }

    await this.updatePageTitleByPageId.execute({
      pageId,
      title,
    });

    return noContent();
  }
}