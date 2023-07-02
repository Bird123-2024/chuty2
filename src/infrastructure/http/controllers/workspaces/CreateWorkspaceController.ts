import { HttpRequest } from '@infrastructure/http/interfaces/HttpRequest';
import { CreateWorkspaceInterface } from '@application/interfaces/use-cases/workspaces/CreateWorkspaceInterface';
import { HttpResponse } from '@infrastructure/http/interfaces/HttpResponse';
import { BaseController } from '@infrastructure/http/controllers/BaseController';
import { Validation } from '@infrastructure/http/interfaces/Validation';
import { created, forbidden } from '@infrastructure/http/helpers/http';
import { CreatePageInterface } from '@application/interfaces/use-cases/pages/createPageInterface';
import { GetPageByIdInterface } from '@application/interfaces/use-cases/pages/getPageByIdInterface';
import { PageNotFoundError } from '@application/errors/PageNotFoundError';
import { AddPageInterface } from '@application/interfaces/use-cases/workspaces/AddPageInterface';
import { AddWorkspaceByUserIdInterface } from '@application/interfaces/use-cases/users/AddWorkspaceByUserIdInterface';

export namespace CreateWorkspaceController {
  export type Request = HttpRequest<CreateWorkspaceInterface.Request> & {
    userId: string;
  };
  export type Response = HttpResponse<{ id: string } | PageNotFoundError>;
}

export class CreateWorkspaceController extends BaseController {
  constructor(
    private readonly createWorkspaceValidation: Validation,
    private readonly createWorkspace: CreateWorkspaceInterface,
    private readonly createPage: CreatePageInterface,
    private readonly getPageById: GetPageByIdInterface,
    private readonly addPage: AddPageInterface,
    private readonly addWorkspaceByUserId: AddWorkspaceByUserIdInterface
  ) {
    super(createWorkspaceValidation);
  }

  async execute(
    httpRequest: CreateWorkspaceController.Request
  ): Promise<CreateWorkspaceController.Response> {
    const { name, icon } = httpRequest.body!;
    const userId = httpRequest.userId!;

    const workspaceId = await this.createWorkspace.execute({
      name,
      icon,
      members: [userId],
      pages: [],
    });

    await this.addWorkspaceByUserId.execute({
      userId,
      workspaceId,
      workspaceName: name,
      workspaceIcon: icon,
    });

    const pageId = await this.createPage.execute({
      title: 'notion clone project',
      icon: '1F575',
      coverPicture: {
        url: 'http://cover-picture.com',
        verticalPosition: 23,
      },
      content: {
        type: 'doc',
        content: [],
      },
      favorite: [],
      pageSettings: {
        font: 'serif',
        smallText: true,
        fullWidth: true,
        lock: false,
      },
      path: null,
      workspaceId,
    });

    const pageOrError = await this.getPageById.execute(pageId);

    if (pageOrError instanceof PageNotFoundError) {
      return forbidden(pageOrError);
    }

    const { reference, path, icon: pageIcon, title, createdAt } = pageOrError;

    await this.addPage.execute({
      workspaceId,
      pageData: {
        id: pageId,
        reference,
        path,
        icon: pageIcon,
        title,
        createdAt,
      },
    });

    return created({ workspaceId });
  }
}
