from setuptools import setup, find_packages

setup(
    name="boxty-cli",
    version="1.0.0",
    description="Boxty CLI - Client interface for the Boxty platform",
    author="Adrian Tucicovenco",
    packages=find_packages(),
    install_requires=[
        "click>=8.0",
        "httpx>=0.24",
    ],
    entry_points={
        "console_scripts": [
            "boxty=boxty_cli.main:cli",
        ],
    },
    python_requires=">=3.9",
)
