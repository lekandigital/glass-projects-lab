using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using SkiaSharp;
using SkiaSharp.Views.Desktop;

namespace GlassmorphismSkiaSharp;

public partial class MainWindow : Window
{
    private readonly List<FloatingParticle> particles = new();
    private readonly Random random = new();
    private DateTime lastUpdate = DateTime.Now;
    private float mouseX;
    private float mouseY;

    public MainWindow()
    {
        InitializeComponent();
        InitializeParticles();

        // Start animation timer
        var timer = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(16) // ~60 FPS
        };
        timer.Tick += (s, e) => skiaCanvas.InvalidateVisual();
        timer.Start();
    }

    private void InitializeParticles()
    {
        // Create floating particles for dynamic effect
        for (var i = 0; i < 15; i++)
        {
            particles.Add(new FloatingParticle
            {
                X = (float)(random.NextDouble() * 900),
                Y = (float)(random.NextDouble() * 600),
                Size = (float)(random.NextDouble() * 30 + 10),
                Speed = (float)(random.NextDouble() * 0.5 + 0.2),
                Opacity = (float)(random.NextDouble() * 0.3 + 0.1),
                Color = GetRandomColor()
            });
        }
    }

    private SKColor GetRandomColor()
    {
        var colors = new[]
        {
            SKColor.Parse("#FF6B6B"), SKColor.Parse("#4ECDC4"), SKColor.Parse("#45B7D1"), SKColor.Parse("#96CEB4"),
            SKColor.Parse("#FFEAA7"), SKColor.Parse("#DDA0DD"), SKColor.Parse("#98D8C8")
        };
        return colors[random.Next(colors.Length)];
    }

    private void OnPaintSurface(object? sender, SKPaintSurfaceEventArgs e)
    {
        var canvas = e.Surface.Canvas;
        var info = e.Info;

        canvas.Clear(SKColors.Transparent);

        // Draw gradient background
        DrawGradientBackground(canvas, info);

        // Draw floating particles
        DrawFloatingParticles(canvas);

        // Update particles for animation
        UpdateParticles(); // Update particles for animation
        UpdateParticles();
    }

    private void DrawGradientBackground(SKCanvas canvas, SKImageInfo info)
    {
        using var paint = new SKPaint();

        // Main gradient background
        var colors = new[] { SKColor.Parse("#667eea"), SKColor.Parse("#764ba2") };
        var positions = new[] { 0.0f, 1.0f };

        using var shader = SKShader.CreateLinearGradient(
            new SKPoint(0, 0),
            new SKPoint(info.Width, info.Height),
            colors,
            positions,
            SKShaderTileMode.Clamp);

        paint.Shader = shader;
        canvas.DrawRect(0, 0, info.Width, info.Height, paint);
    }

    private void DrawFloatingParticles(SKCanvas canvas)
    {
        foreach (var particle in particles)
        {
            using var paint = new SKPaint
            {
                Color = particle.Color.WithAlpha((byte)(particle.Opacity * 255)), IsAntialias = true
            };

            // Create radial gradient for each particle
            var colors = new[]
            {
                particle.Color.WithAlpha((byte)(particle.Opacity * 255)), particle.Color.WithAlpha(0)
            };
            var positions = new[] { 0.0f, 1.0f };

            using var shader = SKShader.CreateRadialGradient(
                new SKPoint(particle.X, particle.Y),
                particle.Size,
                colors,
                positions,
                SKShaderTileMode.Clamp);

            paint.Shader = shader;
            canvas.DrawCircle(particle.X, particle.Y, particle.Size, paint);
        }
    }

    private void UpdateParticles()
    {
        foreach (var particle in particles)
        {
            particle.Y -= particle.Speed;
            if (particle.Y < -particle.Size)
            {
                particle.Y = 600 + particle.Size;
                particle.X = (float)(random.NextDouble() * 900);
            }
        }
    }

    private void OnMouseMove(object sender, MouseEventArgs e)
    {
        var position = e.GetPosition(skiaCanvas);
        mouseX = (float)position.X;
        mouseY = (float)position.Y;

        // Mouse position is tracked but redraw is controlled by timer only
    }

    private void OnMouseDown(object sender, MouseButtonEventArgs e)
    {
        // Add ripple effect or other interaction without forcing redraw
        // Redraw is controlled by timer only
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }

    private void SignInButton_Click(object sender, RoutedEventArgs e)
    {
        MessageBox.Show("Sign in attempt - SkiaSharp Enhanced!", "SkiaSharp Demo",
            MessageBoxButton.OK, MessageBoxImage.Information);
    }
}

public class FloatingParticle
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Size { get; set; }
    public float Speed { get; set; }
    public float Opacity { get; set; }
    public SKColor Color { get; set; }
}
