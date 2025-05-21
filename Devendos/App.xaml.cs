using AppControl = Microsoft.Maui.Controls.Application;

namespace Devendos;

public partial class App : AppControl
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(new MainPage()) { Title = "Devendos" };
    }
}