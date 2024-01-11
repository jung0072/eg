import {
    RESEARCH_TASK,
    SUBMIT_RESEARCH_TASK,
    FINALIZE_RESEARCH_TASK,
    RESEARCH_STUDY_BASE,
    ASSIGN_RESEARCH_TASK,
    DOWNLOAD_TASK_FILE,
    UPLOAD_TASK_FILE,
    EDIT_RESEARCH_TASK,
    RESEARCH_PROJECT_BASE, PROJECT_FILE, UPLOAD_CLOUD_TASK_FILE, PROMPT_USER, PROMPT_ALL_USERS,
} from "../api_url.jsx";
import { rootAPI } from "./rootAPI.js";

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const researchTaskAPI = rootAPI.injectEndpoints({
    endpoints: builder => ({
        deleteProjectTaskFile: builder.mutation({
            query: (data) => {
                return {
                    url: `${BASE_URL}${RESEARCH_STUDY_BASE}${data.projectId}/${data.taskId}/project_file/${data.fileId}/${data.fileType}/`,
                    method: 'DELETE'
                };
            },
        }),
        editProjectTaskFile: builder.mutation({
            query: (data) => {
                return {
                    url: `${BASE_URL}${RESEARCH_STUDY_BASE}${data.projectId}/${data.taskId}/project_file/${data.fileID}/${data.fileType}/`,
                    method: 'PUT',
                    body: { updated_title: data.taskUpdateName, updated_url: data.taskUpdateURL }
                };
            },
        }),
        getTask: builder.query({
            query: taskId => `${BASE_URL}${RESEARCH_TASK}${taskId}`,
            transformResponse: (data) => {
                data['submitted_files'] = data.submitted_files.map((file) => {
                    return {
                        research_project_id: file.research_project_id,
                        task_id: file.task_id,
                        uploaderId: file.uploader_id,
                        uploader_name: file.uploader_name,
                        title: file.title,
                        created_at: file.created_at,
                        file_id: file.file_id,
                        url: file.url
                    };
                });
                return data;
            },
            providesTags: ['CurrentTask']
        }),
        submitTask: builder.mutation({
            query: (submitTaskRequest) => {
                const { projectID, taskID } = submitTaskRequest;
                return {
                    url: `${BASE_URL}${RESEARCH_STUDY_BASE}${projectID}/${taskID}${SUBMIT_RESEARCH_TASK}`,
                    method: 'PATCH',
                    body: submitTaskRequest,
                };
            },
            invalidatesTags: ['CurrentTask'],
        }),
        finalizeTask: builder.mutation({
            query: (finalizeTaskRequest) => {
                const { projectID, taskID } = finalizeTaskRequest;
                return {
                    url: `${BASE_URL}${RESEARCH_STUDY_BASE}${projectID}/${taskID}${FINALIZE_RESEARCH_TASK}`,
                    method: 'PATCH',
                    body: finalizeTaskRequest,
                };
            },
            invalidatesTags: ['CurrentTask'],
        }),
        assignTask: builder.mutation({
            query: (assignTaskRequest) => ({
                url: `${BASE_URL}${RESEARCH_STUDY_BASE}${assignTaskRequest.projectID}/${assignTaskRequest.taskID}${ASSIGN_RESEARCH_TASK}`,
                method: assignTaskRequest.method,
                body: assignTaskRequest
            }),
            invalidatesTags: ['CurrentTask'],
        }),
        uploadFile: builder.mutation({
            query: (fileUploadData) => {
                // first get the different parts of the request like task id and project id that we need for the file
                // upload from the form data, then return a request to upload the file with the proper headers set
                // for this request
                const projectID = fileUploadData.get('projectID');
                const taskID = fileUploadData.get('taskID');
                const fileType = fileUploadData.get('fileType');
                const fileToUpload = fileUploadData.get('fileToUpload');

                return {
                    url: `${BASE_URL}${RESEARCH_STUDY_BASE}${projectID}/${taskID}${UPLOAD_TASK_FILE}${fileType}/`,
                    method: 'POST',
                    body: fileToUpload,
                    headers: {
                        'Content-Disposition': `attachment; filename=${fileToUpload.name}`,
                        'Content-Type': `${fileToUpload.type}`
                    }
                };
            },
            invalidatesTags: ['CurrentTask'],
        }),
        uploadCloudDocument: builder.mutation({
            query: (fileUploadData) => {
                // first get the different parts of the request like task id and project id that we need for the file
                // upload from the form data, then return a request to upload the file with the proper headers set
                // for this request
                const projectID = fileUploadData.get('projectID');
                const taskID = fileUploadData.get('taskID');
                const fileType = fileUploadData.get('fileType');
                const title = fileUploadData.get('title');
                const url = fileUploadData.get('url');

                return {
                    url: `${BASE_URL}${RESEARCH_STUDY_BASE}${projectID}/${taskID}${UPLOAD_CLOUD_TASK_FILE}${fileType}/`,
                    method: 'POST',
                    body: { url, title },
                };
            },
            invalidatesTags: ['CurrentTask'],
        }),
        downloadFile: builder.query({
            query: ({
                fileID,
                taskID,
                projectID
            }) => `${BASE_URL}api/project/${projectID}/${taskID}${DOWNLOAD_TASK_FILE}${fileID}/`,
        }),
        deleteResearchTask: builder.mutation({
            query: (taskData) => {
                return {
                    url: `${BASE_URL}${RESEARCH_PROJECT_BASE}${taskData.projectID}/${taskData.taskID}${EDIT_RESEARCH_TASK}`,
                    method: 'DELETE',
                    body: { 'taskID': taskData.taskID },
                };
            },
            invalidatesTags: ['CurrentTask'],
        }),
        promptUser: builder.mutation({
            query: (args) => {
                return {
                    url: `${BASE_URL}${RESEARCH_STUDY_BASE}${args.projectId}/${args.taskId}/${args.userId}/${PROMPT_USER}`,
                    method: 'POST',
                    body: {},
                };
            },
            invalidatesTags: ['CurrentTask']
        }),
        promptAllUsers: builder.mutation({
            query: (args) => {
                return {
                    url: `${BASE_URL}${RESEARCH_STUDY_BASE}${args.projectId}/${args.taskId}/${PROMPT_ALL_USERS}`,
                    method: 'POST',
                    body: {},
                };
            },
            invalidatesTags: ['CurrentTask']
        })
    })
});

export const {
    useDeleteProjectTaskFileMutation,
    useEditProjectTaskFileMutation,
    useGetTaskQuery,
    useSubmitTaskMutation,
    useFinalizeTaskMutation,
    useAssignTaskMutation,
    useLazyDownloadFileQuery,
    useUploadFileMutation,
    useUploadCloudDocumentMutation,
    useDeleteResearchTaskMutation,
    usePromptUserMutation,
    usePromptAllUsersMutation
} = researchTaskAPI;
