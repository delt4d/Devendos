namespace Devendos.Services;

public interface IPermissionsService<T> where T : Permissions.BasePermission, new()
{
    public Task<PermissionStatus> RequestPermissions();
}

public class PermissionsService<T> : IPermissionsService<T> where T : Permissions.BasePermission, new() 
{
    public async Task<PermissionStatus> RequestPermissions()
    {
        var status = await Permissions.CheckStatusAsync<T>();

        if (status == PermissionStatus.Granted)
            return status;

        if (status == PermissionStatus.Denied && DeviceInfo.Platform == DevicePlatform.iOS)
        {
            // Prompt the user to turn on in settings
            // On iOS once a permission has been denied it may not be requested again from the application
            return status;
        }

        if (Permissions.ShouldShowRationale<T>())
        {
            // Prompt the user with additional information as to why the permission is needed
        }

        status = await Permissions.RequestAsync<T>();

        return status;
    }
}

public interface IClass<T> { }

public class Cls<T> : IClass<T>
{
}