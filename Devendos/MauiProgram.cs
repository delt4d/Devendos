using Devendos.Application.Database;
using Devendos.Application.Services;
using Microsoft.Extensions.Logging;
using MudBlazor.Services;
using SQLite;

namespace Devendos;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts => { fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular"); });

        builder.Services.AddMauiBlazorWebView();
        builder.Services.AddMudServices();
        builder.Services.AddTransient<IContactsService, ContactsService>();
        builder.Services.AddTransient<IContactsSearchService, ContactsSearchService>();
        builder.Services.AddTransient(typeof(IPermissionsService<>), typeof(PermissionsService<>));
        builder.Services.AddSingleton<ISQLiteAsyncConnection>(sp => new SQLiteAsyncConnection(SqliteDbConfig.DatabasePath, SqliteDbConfig.Flags));
        builder.Services.AddSingleton<IAppDb, AppDb>();

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}