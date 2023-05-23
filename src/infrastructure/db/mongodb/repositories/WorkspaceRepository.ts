import { Collection, SetFields } from 'mongodb';
import dbConnection from '@infrastructure/db/mongodb/helpers/db-connection';
import { CreateWorkspaceRepository } from '@application/interfaces/repositories/workspaces/createWorkspaceRepository';
import {
  isValidObjectId,
  mapDocument,
  objectIdToString,
  stringToObjectId,
} from '@infrastructure/db/mongodb/helpers/mapper';
import { AddMemberByWorkspaceIdRepository } from '@application/interfaces/repositories/workspaces/addMemberByWorkspaceIdRepository';
import { AddPageRepository } from '@application/interfaces/repositories/workspaces/addPageRepository';
import { GetAllMembersByWorkspaceIdRepository } from '@application/interfaces/repositories/workspaces/getAllMembersByWorkspaceIdRepository';
import { GetAllRootPagesRepository } from '@application/interfaces/repositories/workspaces/getAllRootPagesRepository';
import { GetChildrensByPageIdRepository } from '@application/interfaces/repositories/workspaces/getChildrensByPageRepsoitory';
import { GetWorkspaceByIdRepository } from '@application/interfaces/repositories/workspaces/getWorkspaceByIdRepository';
import { UpdateWorkspaceRepository } from '@application/interfaces/repositories/workspaces/updateWorkspaceRepository';
import { RemoveMemberByWorkspaceIdRepository } from '@application/interfaces/repositories/workspaces/removeMemberByWorkspaceIdRepository';
import { RemovePageByPageIdRepository } from '@application/interfaces/repositories/workspaces/removePageByPageIdRepository';
import { DeleteWorkspaceRepository } from '@application/interfaces/repositories/workspaces/deleteWorkspaceRepository';

export class WorkspaceRepository
  implements
    CreateWorkspaceRepository,
    AddMemberByWorkspaceIdRepository,
    AddPageRepository,
    GetAllMembersByWorkspaceIdRepository,
    GetAllRootPagesRepository,
    GetChildrensByPageIdRepository,
    GetWorkspaceByIdRepository,
    UpdateWorkspaceRepository,
    RemoveMemberByWorkspaceIdRepository,
    RemovePageByPageIdRepository,
    DeleteWorkspaceRepository
{
  static async getCollection(): Promise<Collection> {
    return dbConnection.getCollection('workspaces');
  }

  async createWorkspace(
    workspaceData: CreateWorkspaceRepository.Request
  ): Promise<CreateWorkspaceRepository.Response> {
    const collection = await WorkspaceRepository.getCollection();
    const { insertedId } = await collection.insertOne({
      ...workspaceData,
      createdAt: new Date(),
    });
    return objectIdToString(insertedId);
  }

  async addMemberByWorkspaceId(
    params: AddMemberByWorkspaceIdRepository.Request
  ): Promise<AddMemberByWorkspaceIdRepository.Response> {
    const collection = await WorkspaceRepository.getCollection();
    const { workspaceId, memberId } = params;

    const { value: rawWorkspace } = await collection.findOneAndUpdate(
      { _id: stringToObjectId(workspaceId) },
      { $addToSet: { members: memberId } } as SetFields<Document>,
      { upsert: true, returnDocument: 'after' }
    );

    return mapDocument(rawWorkspace);
  }

  async addPage(
    params: AddPageRepository.Request
  ): Promise<AddPageRepository.Response> {
    const collection = await WorkspaceRepository.getCollection();
    const { workspaceId, pageData } = params;
    const { value: rawWorkspace } = await collection.findOneAndUpdate(
      { _id: stringToObjectId(workspaceId) },
      { $addToSet: { pages: pageData } } as SetFields<Document>,
      { upsert: true, returnDocument: 'after' }
    );

    return mapDocument(rawWorkspace);
  }

  async getAllMembersByWorkspaceId(
    workspaceId: GetAllMembersByWorkspaceIdRepository.Request
  ): Promise<GetAllMembersByWorkspaceIdRepository.Response> {
    if (!isValidObjectId(workspaceId)) {
      return null;
    }

    const collection = await WorkspaceRepository.getCollection();
    const rawMembers = await collection.findOne(
      { _id: stringToObjectId(workspaceId) },
      { projection: { members: 1 } }
    );

    if (rawMembers) {
      return rawMembers.members;
    }

    return null;
  }

  async getAllRootPages(
    workspaceId: GetAllRootPagesRepository.Request
  ): Promise<GetAllRootPagesRepository.Response> {
    if (!isValidObjectId(workspaceId)) {
      return null;
    }

    const collection = await WorkspaceRepository.getCollection();
    const rawPages = await collection.findOne(
      { _id: stringToObjectId(workspaceId), 'pages.path': null },
      { projection: { pages: 1 } }
    );

    if (rawPages) {
      return rawPages.pages;
    }

    return null;
  }

  async getChildrensByPageId(
    params: GetChildrensByPageIdRepository.Request
  ): Promise<GetChildrensByPageIdRepository.Response> {
    const collection = await WorkspaceRepository.getCollection();
    const { workspaceId, pageId } = params;
    let pageReference = '';
    const rawPageReference = await collection.findOne(
      { _id: stringToObjectId(workspaceId), 'pages.id': pageId },
      { projection: { pages: 1 } }
    );

    if (!rawPageReference) {
      return null;
    }

    pageReference = rawPageReference.pages[0].reference;
    const pathQuery = `/,${pageReference},/`;

    const rawChildrens = await collection.findOne(
      { _id: stringToObjectId(workspaceId), 'pages.path': pathQuery },
      { projection: { pages: 1 } }
    );

    if (rawChildrens) {
      return rawChildrens.pages;
    }

    return null;
  }

  async getWorkspaceById(
    workspaceId: GetWorkspaceByIdRepository.Request
  ): Promise<GetWorkspaceByIdRepository.Response> {
    if (!isValidObjectId(workspaceId)) {
      return null;
    }

    const collection = await WorkspaceRepository.getCollection();
    const rawWorkspace = await collection.findOne({
      _id: stringToObjectId(workspaceId),
    });
    return rawWorkspace && mapDocument(rawWorkspace);
  }

  async updateWorkspace(
    params: UpdateWorkspaceRepository.Request
  ): Promise<UpdateWorkspaceRepository.Response> {
    const collection = await WorkspaceRepository.getCollection();
    const { workspaceId, workspaceData } = params;
    const { value: rawWorkspace } = await collection.findOneAndUpdate(
      {
        _id: stringToObjectId(workspaceId),
      },
      { $set: { ...workspaceData, updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );

    return mapDocument(rawWorkspace);
  }

  async removeMemberByWorkspaceId(
    params: RemoveMemberByWorkspaceIdRepository.Request
  ): Promise<RemoveMemberByWorkspaceIdRepository.Response> {
    const collection = await WorkspaceRepository.getCollection();
    const { workspaceId, memberId } = params;

    const { value: rawWorkspace } = await collection.findOneAndUpdate(
      { _id: stringToObjectId(workspaceId) },
      { $pull: { members: { memberId } } } as SetFields<Document>,
      { returnDocument: 'after' }
    );
    return mapDocument(rawWorkspace);
  }

  async removePageByPageId(
    params: RemovePageByPageIdRepository.Request
  ): Promise<RemovePageByPageIdRepository.Response> {
    const collection = await WorkspaceRepository.getCollection();
    const { workspaceId, pageId } = params;

    const { value: rawWorkspace } = await collection.findOneAndUpdate(
      { _id: stringToObjectId(workspaceId) },
      { $pull: { pages: { pageId } } } as SetFields<Document>,
      { returnDocument: 'after' }
    );
    return mapDocument(rawWorkspace);
  }

  async deleteWorkspace(
    workspaceId: DeleteWorkspaceRepository.Request
  ): Promise<DeleteWorkspaceRepository.Response> {
    const collection = await WorkspaceRepository.getCollection();
    await collection.deleteOne({ _id: stringToObjectId(workspaceId) });
  }
}
