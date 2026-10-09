using Fluffy.Api.Data;
using Fluffy.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
if (!builder.Environment.IsDevelopment()
    && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")))
{
    throw new InvalidOperationException("Set ConnectionStrings__DefaultConnection for the hosted database.");
}
var clientOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? [];
var allowedOrigins = clientOrigins
    .Concat(["https://fluffydb.netlify.app", "http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173"])
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddDbContext<FluffyDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions => sqlOptions.EnableRetryOnFailure()));
builder.Services.AddScoped<LearningService>();
builder.Services.AddScoped<TestService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<LeaderboardService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApp", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment() && builder.Configuration.GetValue("HttpsRedirection:Enabled", true))
{
    app.UseHttpsRedirection();
}
app.UseCors("ClientApp");
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
