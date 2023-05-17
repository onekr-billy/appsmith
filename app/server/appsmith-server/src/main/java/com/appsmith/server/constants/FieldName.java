package com.appsmith.server.constants;

import com.appsmith.server.constants.ce.FieldNameCE;

public class FieldName extends FieldNameCE {

    public static final String APPSMITH_VERSION = "appsmithVersion";
    public static final String AUDIT_LOG_EVENT_DELIMITER = ".";
    public static final String CREATED = "created";
    public static final String UPDATED = "updated";
    public static final String IMPORTED = "imported";
    public static final String EXPORTED = "exported";
    public static final String CLONED = "cloned";
    public static final String FORKED = "forked";
    public static final String EXECUTED = "executed";
    public static final String QUERY = "query";
    public static final String ENVIRONMENT_VARIABLE = "environmentVariable";
    public static final String ENVIRONMENT_VARIABLE_ID = "environmentVariableId";
    public static final String ENVIRONMENT_ID = "environmentId";
    public static final String ENVIRONMENT = "environment";
    public static final String LOGGED_IN = "logged_in";
    public static final String LOGGED_OUT = "logged_out";
    public static final String SIGNED_UP = "signed_up";
    public static final String INSTANCE_SETTING = "instance_setting";
    public static final String GOOGLE = "Google";
    public static final String GITHUB = "GitHub";
    public static final String SAML = "SAML";
    public static final String OIDC = "OIDC";
    public static final String DEPLOYED = "deployed";
    public static final String VIEWED = "viewed";
    public static final String INVITED = "invited";
    public static final String GROUP = "group";
    public static final String INVITED_USERS = "userEmails";
    public static final String PROVIDER = "provider";
    public static final String PUBLIC = "public";
    public static final String PRIVATE = "private";
    public static final String IS_SUCCESSFUL_EXECUTION = "isSuccessfulExecution";
    public static final String STATUS_CODE = "statusCode";
    public static final String TIME_ELAPSED = "timeElapsed";
    public static final String SUCCESS = "success";
    public static final String FAILED = "failed";
    public static final String AUDIT_LOG_FILTER_EVENT_DELIMITER = "_";
    public static final String AUDIT_LOG_APP_MODE_EDIT = "edit";
    public static final String AUDIT_LOG_APP_MODE_VIEW = "view";
    public static final String INVITED_USERS_TO_USER_GROUPS = "invited_users";
    public static final String REMOVED_USERS_FROM_USER_GROUPS = "removed_users";
    public static final String REMOVE_USERS_FROM_USER_GROUPS = "remove_users";
    public static final String INVITE_USERS_TO_USER_GROUPS = "invite_users";
    public static final String ASSIGNED_USER_GROUPS_TO_PERMISSION_GROUPS = "assigned_groups";
    public static final String UNASSIGNED_USER_GROUPS_FROM_PERMISSION_GROUPS = "unassigned_groups";
    public static final String ASSIGNED_TO_PERMISSION_GROUPS = "assigned_user_and_groups";
    public static final String UNASSIGNED_FROM_PERMISSION_GROUPS = "unassigned_users_and_groups";
    public static final String AUDIT_LOGS = "Audit Logs";
    public static final String AUDIT_LOGS_VIEW_MODE = "viewMode";
    public static final String AUDIT_LOGS_ACTION_NAME = "actionName";
    public static final String AUDIT_LOGS_ORIGIN = "origin";
    public static final String AUDIT_LOGS_ORIGIN_CLIENT = "client";
    public static final String AUDIT_LOGS_ORIGIN_SERVER = "server";
    public static final String DEFAULT_USER_PERMISSION_GROUP = "Default Role For All Users";
    public static final String GAC_TAB = "gacTab";
    public static final String ENTITY_UPDATED_PERMISSIONS = "entityUpdatedPermissions";
    public static final String TENANT_GROUP = "TenantGroup";
    public static final String TENANT_ROLE = "TenantRole";
    public static final String INSTANCE_ID = "instanceId";
    public static final String HASHED_INSTANCE_ID = "hashedInstanceId";
    public static final String USAGE_DATA = "usageData";
    public static final String TENANT = "tenant";
    public static final String DEFAULT_ROLES = "Default Roles";
    public static final String CUSTOM_ROLES = "Custom Roles";
    public static final String KEY = "key";
    public static final String LICENSE_KEY = "licenseKey";
    public static final String LICENSE_VALID = "licenseValid";
    public static final String LICENSE_TYPE = "licenseType";
    public static final String LICENSE_STATUS = "licenseStatus";
    public static final String NUMBER_OF_REMOVED_USERS = "numberOfUsersRemoved";
    public static final String NUMBER_OF_ASSIGNED_USER_GROUPS = "numberOfAssignedGroups";
    public static final String NUMBER_OF_UNASSIGNED_USER_GROUPS = "numberOfUnassignedGroups";
    public static final String CREATION_TIME = "creationTime";
    /**
     * Below are the Constants which are used for initialising values in Default Application Roles.
     * Note: If at any point, we need to add Application details such as Application name, please add them using
     * placeholder to the Descriptions.
     */
    public static final String APPLICATION_DEVELOPER = "Developer";
    public static final String APPLICATION_VIEWER = "App Viewer";
    public static final String APPLICATION_DEVELOPER_DESCRIPTION = "Can edit and view this application along with " +
            "inviting other users to edit and view it";
    public static final String APPLICATION_VIEWER_DESCRIPTION = "Can view this application and invite other users to " +
            "view it";
}
