using SQLite;

namespace Devendos.Application.Database;

public interface IAppDb
{
    public Task SaveContactAsync(Models.ContactInfoEntity data);
    public Task<List<Models.ContactInfoEntity>> GetAllContactsAsync();
    public Task RemoveContactAsync(string id);
}

public class AppDb(ISQLiteAsyncConnection conn) : IAppDb
{
    private AsyncTableQuery<Models.ContactInfoEntity> ContactInfoQuery => conn.Table<Models.ContactInfoEntity>();
    
    private async Task InitAsync()
    {
        await conn.CreateTableAsync<Models.ContactInfoEntity>();
    }

    public async Task SaveContactAsync(Models.ContactInfoEntity data)
    {
        await InitAsync();
        await conn.InsertOrReplaceAsync(data);
    }

    public async Task<List<Models.ContactInfoEntity>> GetAllContactsAsync()
    {
        await InitAsync();
        return await ContactInfoQuery.ToListAsync();
    }

    public async Task RemoveContactAsync(string id)
    {
        await InitAsync();
        var contactInfo = await ContactInfoQuery.FirstOrDefaultAsync(x => x.Id == id);
        if (contactInfo is null) return;
        await conn.DeleteAsync<Models.ContactInfoEntity>(id);
    }
}